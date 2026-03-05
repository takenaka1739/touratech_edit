<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    */
    'default' => env('MAIL_MAILER', 'smtp'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    */
    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',

            // EC 側と同じく URL を持たせる（未設定なら null）
            'url' => env('MAIL_URL'),

            'host' => env('MAIL_HOST', '127.0.0.1'),

            // env は文字列になりがちなので int キャストしておく（port 型エラー回避）
            'port' => env('MAIL_PORT') !== null ? (int) env('MAIL_PORT') : 2525,

            // STARTTLS (TLS)
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),

            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),

            'timeout' => null,

            'local_domain' => env(
                'MAIL_EHLO_DOMAIN',
                parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST)
            ),

            /*
             * EC と同じ方針：
             * 証明書検証をゆるめて CN 不一致を無視させる（恒久対応は提供元の証明書修正が本筋）
             */
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true,

            /*
             * 必要なら自動 TLS を切る（EC 側に合わせる）
             * ※サーバが STARTTLS を案内しても自動交渉で詰まる場合の回避
             */
            'auto_tls' => false,
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    */
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Markdown Mail Settings
    |--------------------------------------------------------------------------
    */
    'markdown' => [
        'theme' => 'default',
        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],
];