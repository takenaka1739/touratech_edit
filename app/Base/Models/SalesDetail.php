<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesDetail extends Model
{
    use SoftDeletes;

    protected $table = 't_sale_details';

    protected $fillable = [
        'sale_id',
        'item_id',
        'no',
        'item_kind',
        'sales_unit_price',
        'unit_price',
        'quantity',
        'amount',
        'sales_tax_rate',
        'sales_tax',
        'parent_id',
    ];

    // 🔗 商品情報（m_items）
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    // 🔗 親の売上情報（t_sales）を介して得意先情報を取得
    public function sales()
    {
        return $this->belongsTo(Sales::class, 'sale_id');
    }

    public function customer()
    {
        return $this->sales ? $this->sales->customer() : null;
    }
}
