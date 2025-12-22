<?php

namespace App\Api\ItemClassification\Services;

use App\Base\Models\ItemClassification;
use App\Base\Models\Image;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * public/images ディレクトリ下にある画像を扱うサービスクラス。
 * 画像一覧取得時には public/images に存在するファイルを正として m_images の情報は参照しない。
 * 取りに来た画像が無いといった事への対応は、ユースケースでの責務として、本クラスでは行わない。
 */
class ImageService
{
  /**
   * クエリを構築する。
   * 
   * @param string $keyword 検索キーワード（画像名に対して LIKE 検索）
   * @param string $sort    並び順キー（id_desc / id_asc / name_asc / name_desc）
   * @return クエリビルダー
   */
  private function buildBaseQuery(string $keyword, string $sort)
  {
      // ★ Eloquentではなく DB::table を使用（stdClass を返す）※エイリアス i / c
      $base = DB::table('m_images as i')
          ->leftJoin('m_categories as c', 'c.id', '=', 'i.category_id')
          ->select([
              'i.id',
              'i.category_id',
              'i.name',
              'i.order_by',
              'i.created_at',
              DB::raw('COALESCE(c.name, "") as category_name'),
              DB::raw('COALESCE(c.code, "") as category_code'),
          ])
          ->when($keyword !== '', function ($q) use ($keyword) {
              $q->where('i.name', 'like', '%' . escape_like($keyword) . '%');
          });

      // 並び順（DB側）
      switch ($sort) {
          case 'id_asc':
              $base->orderBy('i.id', 'asc');
              break;
          case 'name_asc':
              $base->orderBy('i.name', 'asc');
              break;
          case 'name_desc':
              $base->orderBy('i.name', 'desc');
              break;
          default:
              $base->orderBy('i.id', 'desc'); // 新しい順
      }

      return $base;
  }

  /**
   * 既存画像一覧（検索・ページング）
   *
   * @param array $cond ['keyword' => string|null, 'sort' => string, 'only_with_file' => bool|int|string, 'page' => int]
   * @return array
   */
  public function list(array $cond): array
  {
    Log::info('debug_public_images', [
      'files' => Storage::disk('public_images')->files(),
      'root'  => config('filesystems.disks.public_images.root'),
      'exists_dir' => is_dir(config('filesystems.disks.public_images.root')),
    ]);

    $cond    = new Collection($cond);
    $keyword = trim((string) $cond->get('keyword', ''));
    $sort    = (string) $cond->get('sort', 'id_desc');
    $perPage = (int) config('const.paginate.per_page', 20);
    $page    = max(1, (int) ($cond->get('page') ?? request('page', 1)));

    // ------------------------------------------------------------
    // ✅ 1. public/images の画像ファイル一覧（実体）
    // ------------------------------------------------------------
    $files = collect(Storage::disk('public_images')->files())
      ->filter(fn($name) => preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $name));

    // ------------------------------------------------------------
    // ✅ 2. m_images の紐づけ情報を取得（JOIN済み）
    // ------------------------------------------------------------
    $dbRows = $this->buildBaseQuery('', 'id_desc')->get(); // keyword/ソートは後で適用する

    // name → DB行 のマップを作る
    $dbMap = $dbRows->keyBy('name');

    // ------------------------------------------------------------
    // ✅ 3. public/images と m_images を filename でマージ
    // ------------------------------------------------------------
    $merged = $files->map(function ($filename) use ($dbMap) {

      $row = $dbMap->get($filename);
      $fullPath = config('filesystems.disks.public_images.root') . '/' . $filename;
      $mtime = filemtime($fullPath);

      return [
        'id'            => $row->id ?? ('file_' . md5($filename)),
        'name'          => $filename,
        'url'           => '/images/' . $filename,
        'exists'        => true, // public/images にあるので true
        'category_id'   => $row->category_id   ?? null,
        'order_by'      => $row->order_by      ?? null,
        'created_at'    => $row->created_at    ?? null,
        'category_name' => $row->category_name ?? null,
        'category_code' => $row->category_code ?? null,
        'mtime'         => $mtime,
      ];
    });

    // ------------------------------------------------------------
    // ✅ 4. keyword 検索
    // ------------------------------------------------------------
    if ($keyword !== '') {
      $merged = $merged->filter(fn($r) =>
        str_contains(mb_strtolower($r['name']), mb_strtolower($keyword))
      );
    }

    // ------------------------------------------------------------
    // ✅ 5. ソート
    // ------------------------------------------------------------
    $merged = match ($sort) {
      'id_asc'    => $merged->sortBy('mtime'),                    // 古い順
      'id_desc'   => $merged->sortByDesc('mtime'),                // 新しい順
      'name_asc'  => $merged->sortBy('name', SORT_NATURAL),
      'name_desc' => $merged->sortByDesc('name', SORT_NATURAL),
      default     => $merged->sortByDesc('mtime'),
    };

    $merged = $merged->values();

    // ------------------------------------------------------------
    // ✅ 6. ページング
    // ------------------------------------------------------------
    $total = $merged->count();
    $last  = (int) max(1, ceil($total / $perPage));
    $page  = min($page, $last);

    $slice = $merged->forPage($page, $perPage)->values();

    return [
      'current_page'   => $page,
      'data'           => $slice,
      'first_page_url' => null,
      'from'           => $total > 0 ? (($page - 1) * $perPage + 1) : null,
      'last_page'      => $last,
      'last_page_url'  => null,
      'links'          => [],
      'next_page_url'  => null,
      'path'           => null,
      'per_page'       => $perPage,
      'prev_page_url'  => null,
      'to'             => $total > 0 ? min($page * $perPage, $total) : null,
      'total'          => $total,
    ];
  }

  // 以降は既存の store / update / delete をそのまま
  public function store(array $data)
  {
    // $data['category_id'] が無ければデータ異常のため何もしない
    if (empty($data['category_id'])) return null;

    return DB::transaction(function () use ($data) {
        // 既存レコードを検索
        $image = Image::where('category_id', $data['category_id'])->first();
        $updateType = 'created';    // ログ出力でのデータベースへの登録方法判別用（初期値は新規作成）

        if ($image) {
          // Update
          $image->name     = $data['name'];
          $image->order_by = $data['order_by'] ?? $image->order_by ?? 0;
          $image->save();

          $updateType = 'updated';
        }
        else
        {
          // Create
          $image = Image::create([
            'category_id' => $data['category_id'],
            'item_id'     => $data['item_id'] ?? null,
            'name'        => $data['name'],
            'order_by'    => $data['order_by'] ?? 0,
          ]);
        }
        
        Log::info('ImageService@store: ' . $updateType, [
          'image_id'    => $image->id,
          'category_id' => $image->category_id,
          'name'        => $image->name,
          'order_by'    => $image->order_by,
        ]);

        return $image;
    });
  }

  public function update(int $id, array $data)
  {
    return DB::transaction(function () use ($id, $data) {

      // ✅ category_id をキーに既存レコードを探す
      if (array_key_exists('category_id', $data)) {
        $m = Image::firstOrNew(['category_id' => $data['category_id']]);
      } else {
        // category_id が無い場合は従来通り ID で検索
        $m = Image::findOrFail($id);
      }

      $before = $m->exists ? $m->toArray() : null;

      if (array_key_exists('name', $data))        $m->name = $data['name'];
      if (array_key_exists('category_id', $data)) $m->category_id = $data['category_id'];
      if (array_key_exists('item_id', $data))     $m->item_id = $data['item_id'];
      if (array_key_exists('order_by', $data))    $m->order_by = $data['order_by'];

      $m->save();

      Log::info('ImageService@update: saved', [
          'id'     => $id,
          'before' => $before,
          'after'  => $m->toArray(),
      ]);

      return $m;
    });
  }

  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      ItemClassification::destroy($id);
    });
  }
}
