<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * t_info_posts（ECのショップ情報/商品情報の投稿）モデル
 *
 * 種別: type = 'shop' | 'product'
 * 状態: status = 'draft' | 'scheduled' | 'published' | 'archived'
 */
class Infoposts extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * 物理テーブル名
     */
    protected $table = 't_info_posts';

    /**
     * 一括代入許可
     */
    protected $fillable = [
        'type',
        'status',
        'title',
        'slug',
        'excerpt',
        'body_md',
        'body_html',
        'cover_image_id',
        'published_at',
        'visible_from',
        'visible_until',
        'is_pinned',
        'pin_until',
        'priority',
        'related_product_id',
        'author_id',
        'updated_by',
        'meta',
    ];

    /**
     * 型キャスト
     */
    protected $casts = [
        'published_at'    => 'datetime',
        'visible_from'    => 'datetime',
        'visible_until'   => 'datetime',
        'pin_until'       => 'datetime',
        'is_pinned'       => 'boolean',
        'meta'            => 'array',
    ];

    /**
     * 便利な定数
     */
    public const TYPE_SHOP    = 'shop';
    public const TYPE_PRODUCT = 'product';

    public const STATUS_DRAFT     = 'draft';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED  = 'archived';

    /**
     * デフォルト値
     */
    protected $attributes = [
        'type'      => self::TYPE_SHOP,
        'status'    => self::STATUS_DRAFT,
        'is_pinned' => false,
        'priority'  => 0,
    ];

    /**************************************************************************
     * リレーション
     **************************************************************************/

    /**
     * カバー画像（m_images）
     */
    public function coverImage()
    {
        return $this->belongsTo(Image::class, 'cover_image_id');
    }

    /**
     * 関連商品（m_items）
     */
    public function relatedProduct()
    {
        return $this->belongsTo(Item::class, 'related_product_id');
    }

    /**
     * 作成者（m_users）
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * 最終更新者（m_users）
     */
    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**************************************************************************
     * スコープ
     **************************************************************************/

    /**
     * 種別で絞り込み
     */
    public function scopeType($q, string $type)
    {
        return $q->where('type', $type);
    }

    public function scopeShop($q)
    {
        return $q->where('type', self::TYPE_SHOP);
    }

    public function scopeProduct($q)
    {
        return $q->where('type', self::TYPE_PRODUCT);
    }

    /**
     * 公開状態（現在時刻基準）
     * - status = published
     * - published_at <= now
     * - visible_from <= now（null許可）
     * - visible_until >= now（null許可）
     * - pin_until の期限切れは is_pinned を無視（並び順のみ影響）
     */
    public function scopePublishedAndVisibleNow($q)
    {
        $now = now();

        return $q->where('status', self::STATUS_PUBLISHED)
                 ->where(function ($qq) use ($now) {
                     $qq->whereNull('published_at')->orWhere('published_at', '<=', $now);
                 })
                 ->where(function ($qq) use ($now) {
                     $qq->whereNull('visible_from')->orWhere('visible_from', '<=', $now);
                 })
                 ->where(function ($qq) use ($now) {
                     $qq->whereNull('visible_until')->orWhere('visible_until', '>=', $now);
                 });
    }

    /**
     * 一覧の標準並び順
     * - ピン留め（未期限切れを優先）→ priority DESC → published_at DESC → id DESC
     */
    public function scopeListOrder($q)
    {
        $now = now();

        return $q->orderByRaw(
                // pin_until が null なら is_pinned をそのまま、期限切れなら 0 扱い
                "CASE WHEN is_pinned = 1 AND (pin_until IS NULL OR pin_until >= ?) THEN 1 ELSE 0 END DESC",
                [$now]
            )
            ->orderBy('priority', 'DESC')
            ->orderBy('published_at', 'DESC')
            ->orderBy('id', 'DESC');
    }

    /**************************************************************************
     * アクセサ/補助
     **************************************************************************/

    /**
     * 現在表示対象か（bool）
     */
    public function getIsActiveAttribute(): bool
    {
        $now = now();

        $publishedOk = $this->status === self::STATUS_PUBLISHED
            && (is_null($this->published_at) || $this->published_at <= $now);

        $fromOk  = is_null($this->visible_from)  || $this->visible_from  <= $now;
        $untilOk = is_null($this->visible_until) || $this->visible_until >= $now;

        return $publishedOk && $fromOk && $untilOk;
    }
}
