<?php

namespace App\Base\Providers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Validator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(
            'Illuminate\Pagination\LengthAwarePaginator',
            'App\Base\Pagination\JsonLengthAwarePaginator'
        );
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);

        // カスタムバリデーションルールを追加
        // 郵便番号
        Validator::extend('zip_code', function ($attribute, $value, $parameters) {
            return preg_match('/\A\d{3}-(\d{4}|\d{2})?\z/', $value);
        });
        // TEL
        Validator::extend('tel', function ($attribute, $value, $parameters) {
            return preg_match('/\A[0-9]{1,5}-?[0-9]{1,4}-?[0-9]{3,4}\z/', $value);
        });
        // パスワード
        Validator::extend('ex_password', function ($attribute, $value, $parameters) {
            return preg_match('/\A(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)[a-zA-Z\d]{8,}+\z/', $value);
        });
        // 単価
        Validator::extend('price', function ($attribute, $value, $parameters) {
            $significantDigits = 8;
            $fractionDigits = 2;
            if (isset($parameters[0])) {
                $significantDigits = intval($parameters[0]);
            }
            if (isset($parameters[1])) {
                $fractionDigits = intval($parameters[1]);
            }
            return preg_match("/\A\d{1,$significantDigits}(\.\d{1,$fractionDigits})?\z/", $value);
        });
        Validator::replacer('price', function ($message, $attribute, $rule, $parameters) {
            $significantDigits = 8;
            $fractionDigits = 2;
            if (isset($parameters[0])) {
                $significantDigits = intval($parameters[0]);
            }
            if (isset($parameters[1])) {
                $fractionDigits = intval($parameters[1]);
            }
            $message = str_replace(':sign', str_pad('', $significantDigits, '9'), $message);
            $message = str_replace(':frac', $fractionDigits, $message);
            return $message;
        });
        // 通貨
        Validator::extend('currency', function ($attribute, $value, $parameters) {
            return preg_match('/\A\d{1,4}(\.\d{1,3})?\z/', $value);
        });
        // 年月
        Validator::extend('month', function ($attribute, $value, $parameters) {
            if ((!is_string($value) && !is_numeric($value))) {
                return false;
            }

            $dt = $value . "/01";
            if (strtotime($dt) === false) {
                return false;
            }
            $date = date_parse($dt);

            return checkdate($date['month'], $date['day'], $date['year']);
        });
    }
}
