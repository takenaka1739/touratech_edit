<?php

namespace App\Api\ItemClassification\Services;

use App\Base\Models\ItemClassification;
use App\Base\Models\Image;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImageService
{
  /**
   * 既存画像一覧（検索・ページング）
   *
   * @param array $cond ['keyword' => string|null, 'sort' => string, 'only_with_file' => bool|int|string, 'page' => int]
   * @return array
   */
  public function list(array $cond): array
{
    $cond       = new Collection($cond);
    $keyword    = trim((string) $cond->get('keyword', ''));
    $sort       = (string) $cond->get('sort', 'id_desc'); // id_desc / id_asc / name_asc / name_desc
    $existsOnly = filter_var($cond->get('only_with_file', false), FILTER_VALIDATE_BOOLEAN)
                  || $cond->get('only_with_file') === '1';
    $perPage    = (int) config('const.paginate.per_page', 20);
    $page       = max(1, (int) ($cond->get('page') ?? request('page', 1)));

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
        case 'id_asc':    $base->orderBy('i.id', 'asc'); break;
        case 'name_asc':  $base->orderBy('i.name', 'asc'); break;
        case 'name_desc': $base->orderBy('i.name', 'desc'); break;
        default:          $base->orderBy('i.id', 'desc'); // 新しい順
    }

    if ($existsOnly) {
        // 全件取得 → 実ファイル存在でフィルタ → PHP側で最終ソート → ページング
        $all = collect($base->get())->map(function ($row) {
            $id    = (int)   ($row->id           ?? 0);
            $name  = (string)($row->name         ?? '');
            $catId = $row->category_id           ?? null;
            $oBy   = $row->order_by              ?? null;
            $cAt   = $row->created_at            ?? null;
            $cName = $row->category_name         ?? '';
            $cCode = $row->category_code         ?? '';

            $path   = public_path('images' . DIRECTORY_SEPARATOR . $name);
            $exists = ($name !== '') && @file_exists($path);

            return [
                'id'            => $id,
                'category_id'   => ($catId !== null && $catId !== '') ? (int) $catId : null,
                'name'          => $name,
                'order_by'      => ($oBy !== null && $oBy !== '') ? (int) $oBy : null,
                'created_at'    => $cAt ? (string) $cAt : null,
                'url'           => $exists ? ('/images/' . $name) : null,
                'exists'        => $exists,
                'category_name' => ($cName !== '') ? (string) $cName : null,
                'category_code' => ($cCode !== '') ? (string) $cCode : null,
                '_path'         => $path, // debug
            ];
        });

        $existsCount   = $all->where('exists', true)->count();
        $missingCount  = $all->where('exists', false)->count();
        $totalAll      = $all->count();

        Log::info('ImageService@list: existsOnly stats', [
            'total_all'    => $totalAll,
            'exists_count' => $existsCount,
            'missing_count'=> $missingCount,
            'sample'       => $all->take(5)->map(fn ($r) => [
                                'id'     => $r['id'],
                                'name'   => $r['name'],
                                'exists' => $r['exists'],
                                'path'   => $r['_path'],
                             ])->values()->all(),
        ]);

        // 1件も実ファイルが無ければフォールバック（noimage含む全件を見せる）
        $filtered = $existsCount > 0 ? $all->where('exists', true) : $all;

        $sorted = (match ($sort) {
            'id_asc'    => $filtered->sortBy('id'),
            'name_asc'  => $filtered->sortBy('name', SORT_NATURAL),
            'name_desc' => $filtered->sortByDesc('name', SORT_NATURAL),
            default     => $filtered->sortByDesc('id'),
        })->values();

        $total   = $sorted->count();
        $last    = (int) max(1, ceil($total / $perPage));
        $page    = min($page, $last);
        $slice   = $sorted->forPage($page, $perPage)->values()
                    ->map(function ($r) { unset($r['_path']); return $r; });

        $result = [
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

        Log::info('ImageService@list: done (existsOnly)', [
            'keyword'        => $keyword,
            'sort'           => $sort,
            'only_with_file' => true,
            'page'           => $result['current_page'],
            'count'          => count($result['data']),
            'total'          => $result['total'],
            'fallback_used'  => $existsCount === 0,
        ]);

        return $result;
    }

    // existsOnly=false → DBページングのまま
    $paginator  = $base->paginate($perPage);
    $collection = $paginator->getCollection();

    $mapped = $collection->map(function ($row) {
        $id    = (int)   ($row->id           ?? 0);
        $name  = (string)($row->name         ?? '');
        $catId = $row->category_id           ?? null;
        $oBy   = $row->order_by              ?? null;
        $cAt   = $row->created_at            ?? null;
        $cName = $row->category_name         ?? '';
        $cCode = $row->category_code         ?? '';

        $path   = public_path('images' . DIRECTORY_SEPARATOR . $name);
        $exists = ($name !== '') && @file_exists($path);

        return [
            'id'            => $id,
            'category_id'   => ($catId !== null && $catId !== '') ? (int) $catId : null,
            'name'          => $name,
            'order_by'      => ($oBy !== null && $oBy !== '') ? (int) $oBy : null,
            'created_at'    => $cAt ? (string) $cAt : null,
            'url'           => $exists ? ('/images/' . $name) : null,
            'exists'        => $exists,
            'category_name' => ($cName !== '') ? (string) $cName : null,
            'category_code' => ($cCode !== '') ? (string) $cCode : null,
        ];
    });

    $paginator->setCollection($mapped->values());
    $result = $paginator->toArray();

    Log::info('ImageService@list: done', [
        'keyword'        => $keyword,
        'sort'           => $sort,
        'only_with_file' => false,
        'page'           => $result['current_page'] ?? null,
        'count'          => is_countable($result['data'] ?? null) ? count($result['data']) : 0,
        'total'          => $result['total'] ?? null,
    ]);

    return $result;
}


  // 以降は既存の store / update / delete をそのまま
  public function store(array $data)
  {
    Log::info('ImageService@store:start', ['data' => $data]);

    DB::transaction(function () use ($data) {
      $image = Image::create([
        'category_id' => $data['category_id'] ?? ItemClassification::max('id'),
        'item_id'     => null,
        'name'        => $data['name'],
        'order_by'    => 0,
      ]);

      Log::info('ImageService@store: created', [
        'image_id'    => $image->id,
        'category_id' => $image->category_id,
        'name'        => $image->name,
        'order_by'    => $image->order_by,
      ]);
    });

    Log::info('ImageService@store:done');
  }

  public function update(int $id, array $data)
  {
    Log::info('ImageService@update:start', ['id' => $id, 'data' => $data]);

    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      /** @var Image $m */
      $m = Image::findOrFail($id);
      $before = $m->toArray();

      if ($data->has('name')) {
        $m->name = $data->get('name');
      }
      if ($data->has('category_id')) {
        $m->category_id = $data->get('category_id'); // null 許容（紐付け解除）
      }
      $m->save();

      Log::info('ImageService@update: saved', [
        'id'     => $id,
        'before' => $before,
        'after'  => $m->toArray(),
      ]);
    });

    Log::info('ImageService@update:done', ['id' => $id]);
  }

  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      ItemClassification::destroy($id);
    });
  }
}
