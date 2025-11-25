<?php

namespace App\Api\info\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        // 認可はミドルウェア(auth, check.general)で制御するので常にtrueでOK
        return true;
    }

    public function rules(): array
    {
        return [

            // ----- 基本必須 -----
            'type'  => ['required', 'in:shop,product'],  // 'Topics' / 'Items'
            'status' => ['required', 'in:draft,published,archived'],

            'title' => ['required', 'string', 'max:200'],

            // ----- 任意項目 -----
            'excerpt' => ['nullable', 'string'],
            'body_md' => ['nullable', 'string'],

            // ----- 公開日時 / 表示制御 -----
            'published_at' => ['nullable', 'date'],
            'visible_from' => ['nullable', 'date'],
            'visible_until' => ['nullable', 'date'],
            'pin_until'    => ['nullable', 'date'],

            'is_pinned' => ['required', 'boolean'],
            'priority'  => ['nullable', 'integer'],

            // ----- 関連商品（Items のときのみ使用） -----
            'related_product_id' => ['nullable', 'integer', 'exists:m_items,id'],

            // ----- 関連カテゴリ（Topics のときに使用予定） -----
            // ※ 今後の migration で追加する予定
            'related_category_code' => ['nullable', 'string', 'max:50'],

            // ----- meta(json) -----
            // meta は JSON で渡されるので array / null を許容
            'meta' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => '投稿タイプは必須です。',
            'title.required' => 'タイトルは必須です。',
            'status.required' => '公開状態は必須です。',
            'related_product_id.exists' => '選択された商品は存在しません。',
        ];
    }
}
