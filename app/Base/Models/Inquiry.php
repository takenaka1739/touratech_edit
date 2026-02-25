<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 問い合わせ（親）
 */
class Inquiry extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 't_inquiries';

    protected $fillable = [
        'item_id',
        'customer_id',
        'customer_name',
        'email',
        'content',
        'details',
        'is_public',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'customer_id' => 'integer',
        'content' => 'integer',
        'is_public' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function histories()
    {
        return $this->hasMany(InquiryHistory::class, 'inquiries_id');
    }
}
