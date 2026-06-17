<?php

namespace App\Api\Shared\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

trait ReportItemVariationTrait
{
    private array $reportItemVariationCache = [];

    private function appendVariationToItemName(string $name, $row): string
    {
        $row = $row instanceof Collection ? $row : new Collection($row);
        $variation = $this->resolveItemVariationLabel($row);

        if ($variation === '') {
            return $name;
        }

        if ($name === '') {
            return $variation;
        }

        return $name . ' ' . $variation;
    }

    private function resolveItemVariationLabel(Collection $row): string
    {
        $direct = $this->buildVariationLabel([
            $row->get('variations1', ''),
            $row->get('variations2', ''),
            $row->get('variations3', ''),
            $row->get('variations4', ''),
        ]);

        if ($direct !== '') {
            return $direct;
        }

        $itemId = (int)($row->get('item_id', 0) ?? 0);
        $itemNumber = trim((string)($row->get('item_number', '') ?? ''));

        if ($itemId <= 0 && $itemNumber === '') {
            return '';
        }

        $cacheKey = $itemId > 0 ? 'id:' . $itemId : 'number:' . $itemNumber;
        if (!array_key_exists($cacheKey, $this->reportItemVariationCache)) {
            $query = DB::table('m_items')
                ->select(['variations1', 'variations2', 'variations3', 'variations4']);

            if ($itemId > 0) {
                $query->where('id', $itemId);
            } else {
                $query->where('item_number', $itemNumber);
            }

            $item = $query->first();

            $this->reportItemVariationCache[$cacheKey] = $item
                ? $this->buildVariationLabel([
                    $item->variations1 ?? '',
                    $item->variations2 ?? '',
                    $item->variations3 ?? '',
                    $item->variations4 ?? '',
                ])
                : '';
        }

        return $this->reportItemVariationCache[$cacheKey];
    }

    private function buildVariationLabel(array $values): string
    {
        return collect($values)
            ->map(fn ($value) => trim((string)$value))
            ->filter()
            ->unique()
            ->values()
            ->implode(' ');
    }
}
