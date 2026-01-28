<?php

namespace App\Api\PickupRanking\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class PickupRankingService
{
    /**
     * PV由来の「有効/無効」だけを実現するためのオーバーライド行の印
     * - note/memo 列にこの文字列が入っている行は「自動(PV)トグル用」とみなす
     * - 有効に戻すときはこの行を削除して“PVに戻る”
     */
    private const AUTO_PV_TOGGLE_MARK = '__AUTO_PV_TOGGLE__';

    public function fetch(array $cond): array
    {
        $c = new Collection($cond);
        $keyword = trim((string)($c->get('c_keyword') ?? ''));
        $page = (int)($c->get('page') ?? 1);
        if ($page <= 0) $page = 1;

        $perPage = 10;
        $limitCandidate = 200;

        $manualRows = $this->getManualRows($keyword);
        $pvRows = $this->getPvRows($keyword, $limitCandidate);
        $merged = $this->mergeRows($manualRows, $pvRows, $limitCandidate);

        $total = count($merged);
        $lastPage = (int)max(1, (int)ceil($total / $perPage));
        if ($page > $lastPage) $page = $lastPage;

        $offset = ($page - 1) * $perPage;
        $slice = array_slice($merged, $offset, $perPage);

        $from = $total === 0 ? 0 : $offset + 1;
        $to = $total === 0 ? 0 : min($offset + $perPage, $total);

        return [
            'rows' => $slice,
            'pager' => [
                'currentPage' => $page,
                'lastPage' => $lastPage,
                'perPage' => $perPage,
                'from' => $from,
                'to' => $to,
                'total' => $total,
            ],
        ];
    }

    public function get(int $id): array
    {
        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        $row = DB::table('t_pickup_rankings as pr')
            ->join('m_items as i', 'i.id', '=', 'pr.item_id')
            ->select(
                'pr.id',
                'pr.item_id',
                'i.code as item_code',
                'pr.is_enabled',
                "pr.{$priorityCol} as manual_priority",
                "pr.{$noteCol} as note"
            )
            ->where('pr.id', $id)
            ->first();

        if (!$row) abort(404);

        $isAuto = ((string)($row->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;

        return [
            'id' => (int)$row->id,
            'item_code' => (string)$row->item_code,
            'represent_item_id' => (int)$row->item_id,
            'is_enabled' => (bool)$row->is_enabled,
            'manual_priority' => $row->manual_priority === null ? null : (int)$row->manual_priority,
            'memo' => $isAuto ? null : $row->note,
            'is_auto_pv' => $isAuto,
        ];
    }

    public function existsByItemCode(string $itemCode): bool
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '') return false;

        return DB::table('t_pickup_rankings as pr')
            ->join('m_items as i', 'i.id', '=', 'pr.item_id')
            ->where('i.code', $itemCode)
            ->exists();
    }

    public function existsByItemCodeExceptId(string $itemCode, int $exceptId): bool
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '') return false;

        return DB::table('t_pickup_rankings as pr')
            ->join('m_items as i', 'i.id', '=', 'pr.item_id')
            ->where('i.code', $itemCode)
            ->where('pr.id', '!=', $exceptId)
            ->exists();
    }

    public function store(array $data): void
    {
        $itemCode = trim((string)($data['item_code'] ?? ''));
        $repId = $data['represent_item_id'] ?? null;

        if ($itemCode === '') abort(422, '商品コードは必須です。');
        if ($this->existsByItemCode($itemCode)) abort(422, 'この商品コードはすでに登録されています。');

        $itemId = $this->resolveRepresentativeItemId($itemCode, $repId);

        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        // ★新規登録時に manual_priority を指定できる
        // - 指定が無ければ末尾に入れる（最大+1）
        $v = $data['manual_priority'] ?? ($data['sort_order'] ?? null);
        $manualPriority = $this->nullOrInt($v);

        if ($manualPriority !== null) {
            // 既存の並び順を下にずらして、指定位置に差し込む（AUTOは対象外）
            $this->shiftManualPrioritiesForInsert($manualPriority);
        } else {
            $max = DB::table('t_pickup_rankings')->max($priorityCol);
            $manualPriority = is_numeric($max) ? ((int)$max + 1) : 1;
        }

        DB::table('t_pickup_rankings')->insert([
            'item_id' => $itemId,
            'is_enabled' => (bool)($data['is_enabled'] ?? true),
            $priorityCol => $manualPriority,
            $noteCol => $data['memo'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function update(int $id, array $data): void
    {
        $itemCode = trim((string)($data['item_code'] ?? ''));
        $repId = $data['represent_item_id'] ?? null;

        if ($itemCode === '') abort(422, '商品コードは必須です。');
        if ($this->existsByItemCodeExceptId($itemCode, $id)) abort(422, 'この商品コードは他の登録で使用されています。');

        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        $target = DB::table('t_pickup_rankings')
            ->select('id', $priorityCol . ' as manual_priority', $noteCol . ' as note')
            ->where('id', $id)
            ->first();

        if (!$target) abort(404);

        $isAuto = ((string)($target->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;
        if ($isAuto) {
            // AUTO(PVトグル) 行は「並び順やメモ」をいじらせない（有効/無効は toggleActive 系で）
            abort(422, 'PV由来（自動）の行は編集できません。');
        }

        $itemId = $this->resolveRepresentativeItemId($itemCode, $repId);

        // ★manual_priority を更新できる（未入力なら並びは維持）
        $v = $data['manual_priority'] ?? ($data['sort_order'] ?? null);
        $newPriority = $this->nullOrInt($v);

        $payload = [
            'item_id' => $itemId,
            'is_enabled' => (bool)($data['is_enabled'] ?? true),
            $noteCol => $data['memo'] ?? null,
            'updated_at' => now(),
        ];

        if ($newPriority !== null) {
            // 手動の中で指定位置へ移動（AUTOは対象外）
            $this->moveManualIdToPriority($id, $newPriority);
            $payload[$priorityCol] = $newPriority;
        }

        DB::table('t_pickup_rankings')
            ->where('id', $id)
            ->update($payload);
    }

    public function delete(int $id): void
    {
        DB::table('t_pickup_rankings')->where('id', $id)->delete();
    }

    /**
     * 既存の手動行（id指定）のトグル
     * - AUTO(PVトグル) 行で「有効に戻す」場合は、その行を削除してPVへ復帰
     */
    public function toggleActive(int $id): bool
    {
        $noteCol = $this->noteColumn();

        $row = DB::table('t_pickup_rankings')
            ->select('id', 'is_enabled', $noteCol . ' as note')
            ->where('id', $id)
            ->first();
        if (!$row) abort(404);

        $new = !(bool)$row->is_enabled;
        $isAuto = ((string)($row->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;

        if ($isAuto && $new === true) {
            DB::table('t_pickup_rankings')->where('id', (int)$row->id)->delete();
            return true;
        }

        DB::table('t_pickup_rankings')
            ->where('id', (int)$row->id)
            ->update([
                'is_enabled' => $new,
                'updated_at' => now(),
            ]);

        return $new;
    }

    /**
     * PV由来（code指定）のトグル
     * - 既に手動がある：通常トグル。ただし AUTO かつ 有効に戻すなら削除してPVへ復帰
     * - 無い：AUTOレコードを作成して無効化（= PVをオーバーライド）
     */
    public function toggleActiveByItemCode(string $itemCode): bool
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '') abort(422, '商品コードは必須です。');

        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        $existing = DB::table('t_pickup_rankings as pr')
            ->join('m_items as i', 'i.id', '=', 'pr.item_id')
            ->where('i.code', $itemCode)
            ->select('pr.id', 'pr.is_enabled', "pr.{$noteCol} as note")
            ->orderBy('pr.id', 'asc')
            ->first();

        if ($existing) {
            $new = !(bool)$existing->is_enabled;
            $isAuto = ((string)($existing->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;

            if ($isAuto && $new === true) {
                DB::table('t_pickup_rankings')->where('id', (int)$existing->id)->delete();
                return true;
            }

            DB::table('t_pickup_rankings')
                ->where('id', (int)$existing->id)
                ->update([
                    'is_enabled' => $new,
                    'updated_at' => now(),
                ]);

            return $new;
        }

        $itemId = $this->resolveRepresentativeItemId($itemCode, null);

        // AUTOオーバーライドは末尾に積む（表示上は「無効グループ」へ）
        $max = DB::table('t_pickup_rankings')->max($priorityCol);
        $nextSort = is_numeric($max) ? ((int)$max + 1) : 1;

        DB::table('t_pickup_rankings')->insert([
            'item_id' => $itemId,
            'is_enabled' => false,
            $priorityCol => $nextSort,
            $noteCol => self::AUTO_PV_TOGGLE_MARK,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return false;
    }

    /**
     * ↑↓並び替え（手動ID配列で再採番）
     * - AUTO(PVトグル) 行は含めない運用前提だが、混じっても弾く
     * - 1..n で採番して「102030」にならないようにする
     */
    public function reorder(array $ids): void
    {
        $ids = array_values(array_filter($ids, fn($v) => is_numeric($v)));
        if (count($ids) === 0) return;

        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        // AUTOは除外
        $autoIds = DB::table('t_pickup_rankings')
            ->whereIn('id', array_map('intval', $ids))
            ->where($noteCol, self::AUTO_PV_TOGGLE_MARK)
            ->pluck('id')
            ->map(fn($v) => (int)$v)
            ->all();

        if (count($autoIds) > 0) {
            $ids = array_values(array_filter($ids, fn($v) => !in_array((int)$v, $autoIds, true)));
        }

        if (count($ids) === 0) return;

        DB::transaction(function () use ($ids, $priorityCol) {
            $sort = 1;
            foreach ($ids as $id) {
                DB::table('t_pickup_rankings')
                    ->where('id', (int)$id)
                    ->update([
                        $priorityCol => $sort,
                        'updated_at' => now(),
                    ]);
                $sort += 1;
            }
        });
    }

    // -------------------------
    // 内部処理
    // -------------------------

    private function getManualRows(string $keyword): array
    {
        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        $q = DB::table('t_pickup_rankings as pr')
            ->join('m_items as i', 'i.id', '=', 'pr.item_id')
            ->select(
                'pr.id as pickup_ranking_id',
                'i.code as item_code',
                'pr.item_id as represent_item_id',
                'i.name as item_name',
                'pr.is_enabled',
                "pr.{$priorityCol} as manual_priority",
                "pr.{$noteCol} as note"
            );

        if ($keyword !== '') {
            $q->where(function ($w) use ($keyword) {
                $w->where('i.code', 'like', "%{$keyword}%")
                    ->orWhere('i.name', 'like', "%{$keyword}%");
            });
        }

        $rows = $q->get();

        return $rows->map(function ($r) {
            $isAuto = ((string)($r->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;

            return [
                'pickup_ranking_id' => (int)$r->pickup_ranking_id,
                'item_code' => (string)$r->item_code,
                'represent_item_id' => (int)$r->represent_item_id,
                'item_name' => (string)$r->item_name,
                'pv_count' => null,
                'is_enabled' => (bool)$r->is_enabled,
                'manual_priority' => $r->manual_priority === null ? null : (int)$r->manual_priority,
                'memo' => $isAuto ? null : $r->note,
                'is_auto_pv' => $isAuto,
                'can_delete' => true,
            ];
        })->all();
    }

    /**
     * PV由来の行を取得（code単位）
     */
    private function getPvRows(string $keyword, int $limit): array
    {
        $hasDeletedAt = Schema::hasColumn('m_items', 'deleted_at');
        $hasIsSell    = Schema::hasColumn('m_items', 'is_sell');

        $pv = DB::table('t_item_views as v')
            ->join('m_items as i', 'i.id', '=', 'v.item_id')
            ->select(
                'i.code as item_code',
                DB::raw('COUNT(*) as pv_count')
            )
            ->whereNotNull('i.code')
            ->where('i.code', '!=', '')
            ->groupBy('i.code')
            ->orderByDesc('pv_count')
            ->limit($limit);

        if ($keyword !== '') {
            $pv->where(function ($w) use ($keyword) {
                $w->where('i.code', 'like', "%{$keyword}%")
                    ->orWhere('i.name', 'like', "%{$keyword}%");
            });
        }

        // 代表item（code内 MIN(id)）
        $rep = DB::table('m_items as i')
            ->select('i.code', DB::raw('MIN(i.id) as represent_item_id'))
            ->whereNotNull('i.code')
            ->where('i.code', '!=', '')
            ->groupBy('i.code');

        if ($hasDeletedAt) $rep->whereNull('i.deleted_at');
        if ($hasIsSell) $rep->where('i.is_sell', 1);

        $q = DB::query()
            ->fromSub($pv, 'p')
            ->joinSub($rep, 'r', function ($join) {
                $join->on('r.code', '=', 'p.item_code');
            })
            ->join('m_items as it', 'it.id', '=', 'r.represent_item_id')
            ->select('p.item_code', 'p.pv_count', 'r.represent_item_id', 'it.name as item_name');

        $rows = $q->get();

        return $rows->map(function ($r) {
            return [
                'pickup_ranking_id' => null,
                'item_code' => (string)$r->item_code,
                'represent_item_id' => (int)$r->represent_item_id,
                'item_name' => (string)($r->item_name ?? ''),
                'pv_count' => (int)$r->pv_count,
                'is_enabled' => true,
                'manual_priority' => null,
                'memo' => null,
                'is_auto_pv' => false,
                'can_delete' => false,
            ];
        })->all();
    }

    /**
     * 表示用に合成
     * - 手動（有効）→ PV → 手動（無効/オーバーライド含む）
     */
    private function mergeRows(array $manualRows, array $pvRows, int $limit): array
    {
        $manualMap = [];
        foreach ($manualRows as $m) $manualMap[$m['item_code']] = $m;

        $pvMap = [];
        foreach ($pvRows as $p) $pvMap[$p['item_code']] = $p;

        foreach ($manualMap as $code => $m) {
            $manualMap[$code]['pv_count'] = isset($pvMap[$code]) ? (int)$pvMap[$code]['pv_count'] : 0;
        }

        $manualEnabled = [];
        $manualDisabled = [];

        foreach ($manualMap as $m) {
            if (($m['is_enabled'] ?? true) === true) $manualEnabled[] = $m;
            else $manualDisabled[] = $m;
        }

        $pvOnlyEnabled = [];
        foreach ($pvRows as $p) {
            if (!isset($manualMap[$p['item_code']])) $pvOnlyEnabled[] = $p;
        }

        usort($manualEnabled, function ($a, $b) {
            $p1 = $a['manual_priority'];
            $p2 = $b['manual_priority'];
            $p1n = ($p1 === null) ? PHP_INT_MAX : (int)$p1;
            $p2n = ($p2 === null) ? PHP_INT_MAX : (int)$p2;
            if ($p1n !== $p2n) return $p1n <=> $p2n;
            return strcmp((string)$a['item_code'], (string)$b['item_code']);
        });

        usort($pvOnlyEnabled, function ($a, $b) {
            $c1 = (int)($a['pv_count'] ?? 0);
            $c2 = (int)($b['pv_count'] ?? 0);
            if ($c1 !== $c2) return $c2 <=> $c1;
            return strcmp((string)$a['item_code'], (string)$b['item_code']);
        });

        usort($manualDisabled, function ($a, $b) {
            return strcmp((string)$a['item_code'], (string)$b['item_code']);
        });

        $merged = array_merge($manualEnabled, $pvOnlyEnabled, $manualDisabled);

        if (count($merged) > $limit) $merged = array_slice($merged, 0, $limit);
        return $merged;
    }

    private function resolveRepresentativeItemId(string $itemCode, $representItemId): int
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '') abort(422, '商品コードが不正です。');

        if ($representItemId !== null && $representItemId !== '') {
            $repId = (int)$representItemId;

            $ok = DB::table('m_items')
                ->where('id', $repId)
                ->where('code', $itemCode)
                ->exists();

            if (!$ok) abort(422, '代表商品IDが商品コードに一致しません。');
            return $repId;
        }

        $minId = DB::table('m_items')->where('code', $itemCode)->min('id');
        if (!$minId) abort(422, '商品コードに一致する商品が見つかりません。');
        return (int)$minId;
    }

    private function priorityColumn(): string
    {
        if (Schema::hasColumn('t_pickup_rankings', 'manual_priority')) return 'manual_priority';
        if (Schema::hasColumn('t_pickup_rankings', 'priority')) return 'priority';
        return 'manual_priority';
    }

    private function noteColumn(): string
    {
        if (Schema::hasColumn('t_pickup_rankings', 'note')) return 'note';
        if (Schema::hasColumn('t_pickup_rankings', 'memo')) return 'memo';
        return 'note';
    }

    private function nullOrInt($v): ?int
    {
        if ($v === null) return null;
        if ($v === '') return null;
        if (!is_numeric($v)) return null;
        $n = (int)$v;
        return $n > 0 ? $n : null;
    }

    /**
     * 指定位置へ挿入するために、手動の表示順（manual_priority）を後ろへずらす
     * - AUTO(PVトグル) は対象外
     * - manual_priority >= $pos の行を +1 する
     */
    private function shiftManualPrioritiesForInsert(int $pos): void
    {
        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        DB::transaction(function () use ($pos, $priorityCol, $noteCol) {
            // AUTOは弾くため noteCol != MARK を条件にする（null も拾いたいので OR）
            $rows = DB::table('t_pickup_rankings')
                ->select('id', $priorityCol . ' as p', $noteCol . ' as note')
                ->whereNotNull($priorityCol)
                ->where($priorityCol, '>=', $pos)
                ->orderBy($priorityCol, 'desc')
                ->orderBy('id', 'desc')
                ->get();

            foreach ($rows as $r) {
                $isAuto = ((string)($r->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;
                if ($isAuto) continue;

                DB::table('t_pickup_rankings')
                    ->where('id', (int)$r->id)
                    ->update([
                        $priorityCol => ((int)$r->p + 1),
                        'updated_at' => now(),
                    ]);
            }
        });
    }

    /**
     * 既存の手動行を指定位置へ移動する（AUTOは対象外）
     * - 対象行を外して詰め、指定位置に差し込み、1..n を維持する
     */
    private function moveManualIdToPriority(int $id, int $pos): void
    {
        $priorityCol = $this->priorityColumn();
        $noteCol = $this->noteColumn();

        DB::transaction(function () use ($id, $pos, $priorityCol, $noteCol) {
            // 手動のid一覧を優先度昇順で取得（AUTO除外）
            $rows = DB::table('t_pickup_rankings')
                ->select('id', $priorityCol . ' as p', $noteCol . ' as note')
                ->orderByRaw("CASE WHEN {$priorityCol} IS NULL THEN 1 ELSE 0 END ASC")
                ->orderBy($priorityCol, 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $ids = [];
            foreach ($rows as $r) {
                $isAuto = ((string)($r->note ?? '')) === self::AUTO_PV_TOGGLE_MARK;
                if ($isAuto) continue;
                $ids[] = (int)$r->id;
            }

            $count = count($ids);
            if ($count === 0) return;

            // pos を 1..count に丸める（対象がリスト内にいない場合も考慮）
            $pos = max(1, min($pos, $count));

            // 対象を抜く
            $ids = array_values(array_filter($ids, fn($v) => (int)$v !== (int)$id));

            // 位置に差し込む（もし抜いたことで count-1 になっても min で守る）
            $insertIndex = max(0, min($pos - 1, count($ids)));
            array_splice($ids, $insertIndex, 0, [$id]);

            // 1..n で再採番（AUTOは触らない）
            $sort = 1;
            foreach ($ids as $rid) {
                DB::table('t_pickup_rankings')
                    ->where('id', (int)$rid)
                    ->update([
                        $priorityCol => $sort,
                        'updated_at' => now(),
                    ]);
                $sort += 1;
            }
        });
    }

    private function isDebugLogEnabled(): bool
    {
        try {
            return (bool)config('app.debug') || (bool)env('PICKUP_RANKING_DEBUG', false);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
