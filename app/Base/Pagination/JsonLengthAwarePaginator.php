<?php

namespace App\Base\Pagination;

use Illuminate\Pagination\LengthAwarePaginator;

class JsonLengthAwarePaginator extends LengthAwarePaginator
{
    public function toArray()
    {
        return [
            'rows' => $this->items->toArray(),
            'pager' => [
                'currentPage' => $this->currentPage(),
                'lastPage' => $this->lastPage(),
                'perPage' => $this->perPage(),
                'from' => $this->firstItem(),
                'to' => $this->lastItem(),
                'total' => $this->total(),
            ]
        ];
    }
}