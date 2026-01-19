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
    $query = ItemClassification::select('id', 'name');
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
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

      $rows = $query->get()->toArray();

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
            'code' => ['このコードは既に使用されています。'],
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
      $m = ItemClassification::find($id);
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
   * 親code を起点に、parent_code=親code の子を辿って子孫IDを全て集める
   *
   * 想定データ:
   * - ルート: parent_code=0（またはNULL/''でも可）
   * - 子    : parent_code=親のcode
   * - 孫    : parent_code=子のcode
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
