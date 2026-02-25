<?php

namespace App\Api\ShopMail\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 宛先（UIで入力 or 受注/問い合わせから自動取得）
            'to_email'        => ['nullable', 'email', 'max:255'],

            // テンプレから送る
            'template_id'     => ['nullable', 'integer'],

            // 手入力で送る（テンプレ未使用）
            'subject'         => ['nullable', 'string', 'max:60'],
            'body'            => ['nullable', 'string', 'max:10000'],

            // 受注明細を付けるか（テンプレ設定とは別に強制ON/OFFしたい場合に使う）
            'include_details' => ['nullable', 'boolean'],

            // 支払いURL（必要なケースのみ）
            'payment_url'     => ['nullable', 'string', 'max:2048'],
        ];
    }
}
