<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Services\MailTemplateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MailTemplateController extends Controller
{
    // 1=自動返信, 2=個別返信（MailTemplate モデルコメント準拠）
    private const TYPE_AUTO  = 1;
    private const TYPE_INDIV = 2;

    public function __construct(
        private MailTemplateService $service
    ) {
    }

    /**
     * テンプレ一覧
     * GET /api/shop-mail/templates?template_type=&is_active=
     */
    public function index(Request $request): JsonResponse
    {
        $cond = [
            'template_type' => $request->query('template_type', ''),
            'is_active'     => $request->query('is_active', ''),
        ];

        $data = $this->service->list($cond);

        // ★ 一覧でも「明細あり/なし」を必ず分かる形で返す（フロント実装を簡単にする）
        $data = $this->decorateTemplates($data);

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * テンプレ詳細
     * GET /api/shop-mail/templates/{id}
     */
    public function show(int $id): JsonResponse
    {
        $row = $this->service->find($id);

        if (!$row) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレが見つかりません。',
            ], 404);
        }

        // ★ 詳細でも同様に付与
        $row = $this->decorateTemplateOne($row);

        return response()->json([
            'success' => true,
            'data'    => $row,
        ]);
    }

    /**
     * テンプレ新規作成
     * POST /api/shop-mail/templates
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_type'       => ['required', 'integer', 'in:1,2'],
            'title'               => ['required', 'string', 'max:255'],
            'subject_template'    => ['required', 'string'],
            'header_template'     => ['nullable', 'string'],
            'footer_template'     => ['nullable', 'string'],
            'detail_mode'         => ['nullable', 'integer'],
            'payment_url_enabled' => ['nullable', 'integer'],
            'shipping_text'       => ['nullable', 'string'],
            'is_active'           => ['nullable', 'integer'],
        ]);

        // ✅ 自動返信テンプレは必ず1つのみ
        if ((int)$validated['template_type'] === self::TYPE_AUTO) {
            $exists = DB::table('m_mail_templates')
                ->whereNull('deleted_at')
                ->where('template_type', self::TYPE_AUTO)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => '自動返信メールのテンプレートは既に存在します（自動返信は1件のみ作成可能です）。',
                    'errors'  => [
                        'template_type' => ['自動返信メールのテンプレートは1件のみ作成できます。'],
                    ],
                ], 422);
            }
        }

        $id  = $this->service->create($validated);
        $row = $this->service->find($id);

        // ★ 作成後レスポンスにも付与
        $row = $row ? $this->decorateTemplateOne($row) : $row;

        return response()->json([
            'success' => true,
            'data'    => $row,
        ], 201);
    }

    /**
     * テンプレ更新
     * PUT /api/shop-mail/templates/{id}
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $row = $this->service->find($id);
        if (!$row) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレが見つかりません。',
            ], 404);
        }

        // ✅ template_type の変更は禁止（一覧からのみ決まる運用）
        if ($request->has('template_type')) {
            $incoming = (int)$request->input('template_type');
            $current  = (int)($row->template_type ?? 0);
            if ($incoming !== $current) {
                return response()->json([
                    'success' => false,
                    'message' => 'メール種別（template_type）は変更できません。',
                    'errors'  => [
                        'template_type' => ['メール種別は変更できません。'],
                    ],
                ], 422);
            }
        }

        // update は部分更新 OK
        $validated = $request->validate([
            'title'               => ['sometimes', 'string', 'max:255'],
            'subject_template'    => ['sometimes', 'string'],
            'header_template'     => ['sometimes', 'nullable', 'string'],
            'footer_template'     => ['sometimes', 'nullable', 'string'],
            'detail_mode'         => ['sometimes', 'integer'],
            'payment_url_enabled' => ['sometimes', 'integer'],
            'shipping_text'       => ['sometimes', 'nullable', 'string'],
            'is_active'           => ['sometimes', 'integer'],
        ]);

        $this->service->update($id, $validated);
        $row2 = $this->service->find($id);

        // ★ 更新後レスポンスにも付与
        $row2 = $row2 ? $this->decorateTemplateOne($row2) : $row2;

        return response()->json([
            'success' => true,
            'data'    => $row2,
        ]);
    }

    /**
     * テンプレ削除（ソフトデリート）
     * DELETE /api/shop-mail/templates/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $row = $this->service->find($id);
        if (!$row) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレが見つかりません。',
            ], 404);
        }

        $this->service->delete($id);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * 明細設定（マスタ一式）
     * GET /api/shop-mail/detail-settings
     */
    public function detailSettings(): JsonResponse
    {
        $data = $this->service->getDetailSettings();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * 明細設定の一括更新
     * PUT /api/shop-mail/detail-settings
     */
    public function updateDetailSettings(Request $request): JsonResponse
    {
        $contentType = (string) $request->header('Content-Type', '');

        // 1) まずは JSON ボディを確実に取る（配列ルート対策）
        $raw = $request->getContent();
        $decoded = null;
        if ($raw !== '') {
            $decoded = json_decode($raw, true);
        }

        // 2) 互換: { rows: [...] } の場合
        $rows = null;
        if (is_array($decoded) && array_key_exists('rows', $decoded) && is_array($decoded['rows'])) {
            $rows = $decoded['rows'];
        } elseif (is_array($decoded)) {
            // 配列ルート or オブジェクト（ただし rows キー無し）
            $rows = $decoded;
        } else {
            // 最後の保険（フォーム送信等）
            $fallback = $request->all();
            if (is_array($fallback) && array_key_exists('rows', $fallback) && is_array($fallback['rows'])) {
                $rows = $fallback['rows'];
            } elseif (is_array($fallback)) {
                $rows = $fallback;
            }
        }

        if (!is_array($rows)) {
            Log::warning('[ShopMail] updateDetailSettings: invalid payload', [
                'content_type' => $contentType,
                'raw_head'     => mb_substr((string)$raw, 0, 200),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'payload が不正です。',
            ], 400);
        }

        // rows が空なら「受け取り失敗 or フロントが空配列送信」なので気づけるようにログ
        if (count($rows) === 0) {
            Log::warning('[ShopMail] updateDetailSettings: rows empty', [
                'content_type' => $contentType,
                'raw_head'     => mb_substr((string)$raw, 0, 200),
            ]);
        }

        $updatedCount = $this->service->updateDetailSettings($rows);

        return response()->json([
            'success' => true,
            'data'    => [
                'updated' => $updatedCount,
            ],
        ]);
    }

    /**
     * list() の返却（配列/Collection/オブジェクト混在）を吸収して、
     * 各テンプレに has_details / detail_mode_label を付与する
     */
    private function decorateTemplates($data)
    {
        // Collection
        if ($data instanceof \Illuminate\Support\Collection) {
            return $data->map(fn($row) => $this->decorateTemplateOne($row));
        }

        // paginate等（items() を持つ）
        if (is_object($data) && method_exists($data, 'items') && method_exists($data, 'toArray')) {
            $arr = $data->toArray();

            // 典型: ['data'=>[...], ...]
            if (isset($arr['data']) && is_array($arr['data'])) {
                $arr['data'] = array_map(fn($row) => $this->decorateTemplateOne($row), $arr['data']);
                return $arr;
            }

            // items() が配列で取れる場合
            $items = $data->items();
            if (is_array($items)) {
                $decorated = array_map(fn($row) => $this->decorateTemplateOne($row), $items);
                $arr['data'] = $decorated;
                return $arr;
            }

            return $arr;
        }

        // 配列（すでに rows だけ等）
        if (is_array($data)) {
            // 典型: [ {..}, {..} ]
            if (array_is_list($data)) {
                return array_map(fn($row) => $this->decorateTemplateOne($row), $data);
            }
            // 典型: ['rows'=>[...] / 'data'=>[...]]
            if (isset($data['data']) && is_array($data['data'])) {
                $data['data'] = array_map(fn($row) => $this->decorateTemplateOne($row), $data['data']);
                return $data;
            }
            if (isset($data['rows']) && is_array($data['rows'])) {
                $data['rows'] = array_map(fn($row) => $this->decorateTemplateOne($row), $data['rows']);
                return $data;
            }
        }

        // その他はそのまま
        return $data;
    }

    /**
     * 1件に付与（配列/オブジェクト両対応）
     */
    private function decorateTemplateOne($row)
    {
        $detailMode = null;

        if (is_array($row)) {
            $detailMode = $row['detail_mode'] ?? null;
        } elseif (is_object($row)) {
            $detailMode = $row->detail_mode ?? null;
        }

        $hasDetails = ((int)($detailMode ?? 0) === 1);

        if (is_array($row)) {
            $row['has_details'] = $hasDetails;
            $row['detail_mode_label'] = $hasDetails ? '明細あり' : '明細なし';
            return $row;
        }

        // object の場合はプロパティ追加（stdClass/Eloquentなど想定）
        $row->has_details = $hasDetails;
        $row->detail_mode_label = $hasDetails ? '明細あり' : '明細なし';
        return $row;
    }
}