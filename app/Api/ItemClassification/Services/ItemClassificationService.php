<?php

namespace App\Api\ItemClassification\Services;

use App\Base\Models\ItemClassification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * 商品分類マスタサービス
 */
class ItemClassificationService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = ItemClassification::select(
      'id',
      'name',
      'code',
      'parent_code',
      'is_display',
      'sort_order'
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('sort_order', 'asc')
      ->orderBy('name', 'asc');

    $rows = $this->appendAncestorRowsForSearch($query->get(), $cond)->toArray();

    return [
      'rows'  => $rows,
      'pager' => [
        'currentPage' => 1,
        'lastPage'    => 1,
        'perPage'     => count($rows),
        'from'        => count($rows) > 0 ? 1 : 0,
        'to'          => count($rows),
        'total'       => count($rows),
      ],
    ];
  }

  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
      $query = ItemClassification::select(
          'id',
          'name',
          'code',
          'parent_code',
          'is_display',
          'sort_order'
      );

      // 検索条件
      $query = $this->setCondition($query, $cond);

      // 並び順：sort_order → name
      $query->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc');

      $rows = $this->appendAncestorRowsForSearch($query->get(), $cond)->toArray();

      return [
          'rows'  => $rows,
          'pager' => [
              'total' => count($rows),
          ],
      ];
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 商品分類ID
   * @return array
   */
  public function get(int $id)
  {
    $selectItems = ItemClassification::select(
      'm_categories.id',
      'm_categories.is_display',
      'm_categories.code',
      'm_categories.parent_code',
      'm_categories.name',
      'm_categories.remarks',
      'm_categories.sort_order',
      'm_images.id AS image_id',
      'm_images.name AS image'
    )
      ->leftJoin('m_images', 'm_categories.id', '=', 'm_images.category_id')
      ->where('m_categories.id', '=', $id)
      ->first()
      ->toArray();

    $parentName = (($selectItems['parent_code'] ?? '') !== '')
      ? ItemClassification::where('code', $selectItems['parent_code'])->value('name')
      : $selectItems['name'];

    $parentCode = (($selectItems['parent_code'] ?? '') !== '')
      ? $selectItems['parent_code']
      : $selectItems['code'];

    $code = (($selectItems['parent_code'] ?? '') !== '')
      ? $selectItems['code']
      : '';

    $selectItems['parent_name'] = $parentName;
    $selectItems['parent_code'] = $parentCode;
    $selectItems['code']        = $code;

    return $selectItems;
  }

  /**
   * 登録（作成したIDを返す）
   *
   * @param array $data 登録データ
   * @return int 新規作成したカテゴリID
   */
  public function store(array $data): int
  {
    Log::info('ItemClassificationService@store:start', ['data' => $data]);

    // ※ store の挙動は現状維持（削除済み code があれば復活＆上書き）
    $newId = 0;

    DB::transaction(function () use ($data, &$newId) {
      $collection = new Collection($data);
      $code       = $collection->get('code');

      // 同一コードのレコード（削除済みも含む）を検索
      $existing = ItemClassification::withTrashed()
        ->where('code', $code)
        ->first();

      if ($existing) {
        if ($existing->trashed()) {
          // ソフトデリート済み → 復活＆上書き更新
          Log::info('ItemClassificationService@store:restore deleted classification', [
            'code' => $code,
            'id'   => $existing->id,
          ]);

          $existing->fill([
            'name'        => $collection->get('name'),
            'code'        => $code,
            'parent_code' => $collection->get('parent_code'),
            'is_display'  => $collection->get('is_display', 1),
            'sort_order'  => $collection->get('sort_order', 0),
            'remarks'     => $collection->get('remarks'),
          ]);

          $existing->restore();
          $newId = (int) $existing->id;
        } else {
          // 生存レコードとコード重複
          Log::warning('ItemClassificationService@store: duplicate active code', [
            'code' => $code,
            'id'   => $existing->id,
          ]);

          throw ValidationException::withMessages([
            'code' => [$this->buildCodeInUseMessage((string)$code, $existing)],
          ]);
        }
      } else {
        $model = ItemClassification::create($data);
        $newId = (int) $model->id;

        Log::info('ItemClassificationService@store:created new classification', [
          'id'   => $newId,
          'code' => $code,
        ]);
      }
    });

    Log::info('ItemClassificationService@store:done', ['id' => $newId]);
    return $newId;
  }

  /**
   * 更新
   *
   * @param int $id 商品分類ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    Log::debug('デバッグ：ItemClassificationService.update', $data);

    $data = new Collection($data);

    DB::transaction(function () use ($id, $data) {
      $m = ItemClassification::findOrFail($id);

      $oldCode = (string) $m->code;
      $newCode = (string) ($data->get('code') ?? '');

      // code が変更された場合
      if ($newCode !== '' && $newCode !== $oldCode) {
        // ★修正：同一 code が存在する場合
        // - 生存レコードなら NG（エラー）
        // - 削除済み(trashed)なら OK（削除済み側の code を退避して空ける）
        $dup = ItemClassification::withTrashed()
          ->where('code', $newCode)
          ->where('id', '<>', $id)
          ->first();

        if ($dup) {
          if ($dup->trashed()) {
            // 削除済みなら code を一時退避して再利用できるようにする
            $this->vacateDeletedCode($dup);
          } else {
            // 生存レコードと重複 → エラー
            throw ValidationException::withMessages([
              'code' => [$this->buildCodeInUseMessage($newCode, $dup)],
            ]);
          }
        }

        // ★既存：code が変更された場合、配下の子孫の code / parent_code も追従変更
        $this->cascadeRenameCodes((int) $m->id, $oldCode, $newCode);
      }

      $m->name        = $data->get('name');
      $m->is_display  = $data->get('is_display');
      $m->code        = $data->get('code');
      $m->parent_code = $data->get('parent_code');
      $m->sort_order  = $data->get('sort_order', 0);
      $m->remarks     = $data->get('remarks');
      $m->save();
    });
  }

  /**
   * 重複時の表示文言（最小）
   * 例：
   * 分類コード「1」は既に使用されています。
   * カテゴリ区分：親カテゴリ
   * 商品分類名：親１
   *
   * ※ 改行は "\n"。表示側(appAlert)で white-space: pre-line 等が必要。
   */
  private function buildCodeInUseMessage(string $code, ItemClassification $existing): string
  {
    $selfCode   = (string) ($existing->code ?? '');
    $parentCode = (string) ($existing->parent_code ?? '');
    $name       = (string) ($existing->name ?? '');

    // 親判定：親は parent_code === code（このプロジェクト定義）
    $isParent = ($parentCode !== '' && $parentCode === $selfCode);
    $kind = $isParent ? '親カテゴリ' : '子カテゴリ';

    return implode("\n", [
      "分類コード「{$code}」は既に使用されています。",
      "カテゴリ区分：{$kind}",
      "商品分類名：{$name}",
    ]);
  }

  /**
   * 削除済み(soft delete)レコードが保持している code を退避して、同一 code を再利用できるようにする。
   * - 削除済みのまま維持（restore はしない）
   * - code をユニークな一時値へ変更する（MySQL の UNIQUE 制約対策）
   */
  private function vacateDeletedCode(ItemClassification $deleted): void
  {
    $id = (int) $deleted->id;
    $old = (string) ($deleted->code ?? '');

    // 可能な限り衝突しない一時コード
    $tmp = '__DELETED__' . $id . '__' . now()->format('YmdHis') . '__';

    Log::info('ItemClassificationService@vacateDeletedCode', [
      'id' => $id,
      'from' => $old,
      'to' => $tmp,
    ]);

    DB::table('m_categories')
      ->where('id', $id)
      ->update([
        'code' => $tmp,
        'updated_at' => now(),
      ]);
  }

  /**
   * 削除（ソフトデリート）
   * - 指定IDの分類 + 子孫（parent_code=親code を辿る）を全て削除
   * - t_category_item_combinations も category_id が一致するものを全て削除（ソフトデリート）
   *
   * @param int $id 商品分類ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      $now = now();

      /** @var ItemClassification $root */
      $root = ItemClassification::query()->findOrFail($id);

      // code を起点に parent_code を辿って子孫を全取得（id一覧）
      $cascadeIds = $this->collectCascadeIdsByParentCode($root->code, (int) $root->id);

      Log::info('ItemClassificationService@delete:cascade', [
        'root_id'   => (int) $root->id,
        'root_code' => (string) $root->code,
        'ids'       => $cascadeIds,
      ]);

      // 1) m_categories（ItemClassification）をソフトデリート
      ItemClassification::query()
        ->whereIn('id', $cascadeIds)
        ->get()
        ->each(function (ItemClassification $m) {
          $m->delete();
        });

      // 2) t_category_item_combinations をソフトデリート（deleted_at がある前提）
      $affected = DB::table('t_category_item_combinations')
        ->whereIn('category_id', $cascadeIds)
        ->whereNull('deleted_at')
        ->update([
          'deleted_at' => $now,
          'updated_at' => $now,
        ]);

      Log::info('ItemClassificationService@delete:combinations_soft_deleted', [
        'count' => (int) $affected,
      ]);
    });
  }

  /**
   * 親code変更を子孫へ伝播（code / parent_code を追従変更）
   * - ユニーク制約衝突回避のため一旦 tmp code に退避してから最終反映
   *
   * @param int    $rootId
   * @param string $oldRootCode
   * @param string $newRootCode
   */
  private function cascadeRenameCodes(int $rootId, string $oldRootCode, string $newRootCode): void
  {
    // 変更対象（自分＋子孫）
    $ids = $this->collectCascadeIdsByParentCode($oldRootCode, $rootId);

    $rows = ItemClassification::query()
      ->select(['id', 'code', 'parent_code'])
      ->whereIn('id', $ids)
      ->get();

    // old_code => new_code マップ作成（prefix置換）
    $codeMap = [];
    foreach ($rows as $r) {
      $oldCode = (string) $r->code;

      if ((int) $r->id === $rootId) {
        $codeMap[$oldCode] = $newRootCode;
        continue;
      }

      $prefix = $oldRootCode . '-';
      if (str_starts_with($oldCode, $prefix)) {
        $codeMap[$oldCode] = $newRootCode . substr($oldCode, strlen($oldRootCode));
      } else {
        // 想定外（命名規則が崩れている等）は触らずログだけ残す
        Log::warning('ItemClassificationService@cascadeRenameCodes:code_not_prefixed', [
          'root_id' => $rootId,
          'old_root_code' => $oldRootCode,
          'row_id' => (int) $r->id,
          'row_code' => $oldCode,
        ]);
      }
    }

    // 1) tmp code に退避（ユニーク衝突回避）
    foreach ($rows as $r) {
      DB::table('m_categories')
        ->where('id', (int) $r->id)
        ->update([
          'code' => '__TMP__' . (int) $r->id . '__',
          'updated_at' => now(),
        ]);
    }

    // 2) 最終 code / parent_code を反映
    foreach ($rows as $r) {
      $oldCode = (string) $r->code;
      $oldParent = (string) $r->parent_code;

      $finalCode = $codeMap[$oldCode] ?? $oldCode;
      $finalParent = isset($codeMap[$oldParent]) ? $codeMap[$oldParent] : $oldParent;

      DB::table('m_categories')
        ->where('id', (int) $r->id)
        ->update([
          'code' => $finalCode,
          'parent_code' => $finalParent,
          'updated_at' => now(),
        ]);
    }

    Log::info('ItemClassificationService@cascadeRenameCodes:done', [
      'root_id' => $rootId,
      'old_root_code' => $oldRootCode,
      'new_root_code' => $newRootCode,
      'count' => count($ids),
    ]);
  }

  /**
   * 親code を起点に、parent_code=親code の子を辿って子孫IDを全て集める
   *
   * @param string $rootCode
   * @param int    $rootId
   * @return array<int>
   */
  private function collectCascadeIdsByParentCode(string $rootCode, int $rootId): array
  {
    $ids = [$rootId];

    // 次に探す「親code」群
    $queueCodes = [$rootCode];

    // 既に探索済みcode（無限ループ防止）
    $seenCodes = [$rootCode => true];

    while (!empty($queueCodes)) {
      $parentCodes = $queueCodes;
      $queueCodes = [];

      $children = ItemClassification::query()
        ->select(['id', 'code', 'parent_code'])
        ->whereIn('parent_code', $parentCodes)
        ->get();

      Log::debug('ItemClassificationService@collectCascade:step', [
        'parent_codes' => $parentCodes,
        'children_cnt' => $children->count(),
        'children'     => $children->map(fn($c) => ['id' => (int)$c->id, 'code' => (string)$c->code, 'parent_code' => (string)$c->parent_code])->toArray(),
      ]);

      foreach ($children as $child) {
        $childId   = (int) $child->id;
        $childCode = (string) $child->code;

        if (!in_array($childId, $ids, true)) {
          $ids[] = $childId;
        }

        // 次の探索対象は「子のcode」
        if (!isset($seenCodes[$childCode])) {
          $seenCodes[$childCode] = true;
          $queueCodes[] = $childCode;
        }
      }
    }

    return $ids;
  }

  /**
   * 検索で子分類だけがヒットした場合でも、ツリー表示に必要な親分類を結果へ追加する。
   *
   * @param \Illuminate\Support\Collection<int, \App\Base\Models\ItemClassification> $rows
   * @param array $cond
   * @return \Illuminate\Support\Collection<int, \App\Base\Models\ItemClassification>
   */
  private function appendAncestorRowsForSearch(Collection $rows, array $cond): Collection
  {
    $keyword = trim((string) (new Collection($cond))->get('c_keyword', ''));
    if ($keyword === '' || $rows->isEmpty()) {
      return $rows;
    }

    $byId = $rows->keyBy('id');
    $knownCodes = $rows
      ->pluck('code')
      ->filter(fn($code) => $code !== null && $code !== '')
      ->map(fn($code) => (string) $code)
      ->flip();

    $queue = $rows
      ->pluck('parent_code')
      ->filter(fn($code) => $code !== null && $code !== '')
      ->map(fn($code) => (string) $code)
      ->reject(fn($code) => isset($knownCodes[$code]))
      ->unique()
      ->values();

    while ($queue->isNotEmpty()) {
      $parents = ItemClassification::select(
          'id',
          'name',
          'code',
          'parent_code',
          'is_display',
          'sort_order'
        )
        ->whereIn('code', $queue->all())
        ->orderBy('sort_order', 'asc')
        ->orderBy('name', 'asc')
        ->get();

      if ($parents->isEmpty()) {
        break;
      }

      $queue = collect();

      foreach ($parents as $parent) {
        $parentId = (int) $parent->id;
        $parentCode = (string) ($parent->code ?? '');
        $parentParentCode = (string) ($parent->parent_code ?? '');

        if (!$byId->has($parentId)) {
          $byId->put($parentId, $parent);
        }

        if ($parentCode !== '') {
          $knownCodes->put($parentCode, true);
        }

        if (
          $parentParentCode !== '' &&
          $parentParentCode !== $parentCode &&
          !$knownCodes->has($parentParentCode)
        ) {
          $queue->push($parentParentCode);
        }
      }

      $queue = $queue->unique()->values();
    }

    return $byId
      ->values()
      ->sort(function ($a, $b) {
        $order = ((int) ($a->sort_order ?? 0)) <=> ((int) ($b->sort_order ?? 0));
        return $order !== 0
          ? $order
          : strcmp((string) ($a->name ?? ''), (string) ($b->name ?? ''));
      })
      ->values();
  }

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $cond = new Collection($cond);
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(' ', $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function ($query) use ($key) {
          $query->where('name', 'like', '%' . escape_like($key) . '%');
        });
      }
    }
    return $query;
  }
}
