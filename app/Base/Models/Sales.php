<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Sales extends Model
{
    protected $table = 't_sales';

    protected $fillable = [
        'item_id',
        'customer_id',
        'personnel_id',
        'payment_id',
        'invoice_number',
        'is_invoice_check',
        'shipping_invoice_number',
        'sales_form',
        'sales_type',
        'sales_at',
        'billing_at',
        'payment_at',
        'shipping_amount',
        'fee',
        'discount',
        'total_amount',
        'shipped_at',
        'delivery_at',
        'is_individual_email_sent',
        'order_no',
        'remarks',
        'send_flg',
        'is_send',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function details()
    {
        return $this->hasMany(SalesDetail::class, 'sale_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function personnel()
    {
        return $this->belongsTo(\App\Base\Models\Personnel::class, 'personnel_id');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    /**
     * 紐づいている受注IDを取得する
     */
    public function getReceiveOrderId()
    {
        $r = DB::table('t_link_r_order_sales')
            ->select('receive_order_id')
            ->where('sales_id', $this->id)
            ->first();

        return $r ? $r->receive_order_id : null;
    }

    /**
     * 明細に登録されている商品番号（= m_items.code）を取得する
     *
     * 旧: sales_details.item_number を保持していたが、
     * 新: t_sale_details は item_id 正規化なので m_items から取得する
     */
    public function getItemNumbers(): array
    {
        return DB::table('t_sale_details as d')
            ->join('m_items as i', 'i.id', '=', 'd.item_id')
            ->where('d.sale_id', $this->id)
            ->whereIn('d.item_kind', [1, 3])
            ->whereNull('d.deleted_at') // SalesDetail が SoftDeletes のため
            ->pluck('i.code')
            ->all();
    }
}
