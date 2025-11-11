<?php

namespace App\Api\info\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Base\Models\Item;

class InfoLookupController extends BaseController
{
    public function items(Request $req)
    {
        $q     = trim((string)$req->query('q', ''));
        $limit = (int)$req->query('limit', 20);
        Log::info('[InfoLookupController] items', ['q' => $q, 'limit' => $limit]); // ★

        try {
            $limit = max(1, min($limit, 50));
            if ($q === '') {
                Log::info('[InfoLookupController] empty q'); // ★
                return response()->json([]);
            }

            $builder = Item::query()
                ->select(['id', 'item_number', 'name', 'name_jp'])
                ->whereNull('deleted_at');

            $isNumeric = preg_match('/^\d+$/', $q) === 1;

            $builder->where(function ($qq) use ($q, $isNumeric) {
                $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
                $qq->where('item_number', 'like', $like)
                   ->orWhere('name', 'like', $like)
                   ->orWhere('name_jp', 'like', $like);

                if ($isNumeric) {
                    $qq->orWhere('id', (int)$q);
                }
            });

            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q);
            $starts = $escaped . '%';
            $orderSql = "
                (CASE
                    WHEN id = ? THEN 100
                    WHEN item_number LIKE ? THEN 50
                    WHEN name LIKE ? THEN 40
                    WHEN name_jp LIKE ? THEN 40
                    WHEN item_number LIKE ? THEN 20
                    WHEN name LIKE ? THEN 10
                    WHEN name_jp LIKE ? THEN 10
                    ELSE 0
                END) DESC
            ";

            $rows = $builder
                ->orderByRaw($orderSql, [
                    $isNumeric ? (int)$q : 0,
                    $starts, $starts, $starts,
                    '%' . $escaped . '%', '%' . $escaped . '%', '%' . $escaped . '%',
                ])
                ->orderBy('id', 'desc')
                ->limit($limit)
                ->get();

            $result = $rows->map(function ($r) {
                $label = trim(($r->item_number ? "[{$r->item_number}] " : '') . ($r->name ?? $r->name_jp ?? ''));
                return [
                    'id'          => (int)$r->id,
                    'item_number' => (string)($r->item_number ?? ''),
                    'name'        => (string)($r->name ?? $r->name_jp ?? ''),
                    'label'       => $label !== '' ? $label : ('ID:' . $r->id),
                ];
            });

            Log::info('[InfoLookupController] items ok', ['count' => $result->count()]); // ★
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('[InfoLookupController] items error', ['ex' => $e]); // ★
            return response()->json(['message' => 'lookup failed'], 500);
        }
    }
}
