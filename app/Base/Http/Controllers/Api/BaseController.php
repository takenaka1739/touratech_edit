<?php

namespace App\Base\Http\Controllers\Api;

use App\Base\Http\Controllers\Controller;
abstract class BaseController extends Controller
{
    /**
     * success
     *
     * @param array $data
     * @param int $status
     * @param array $headers
     * @return \Illuminate\Http\JsonResponse
     */
    protected function success(array $data = [], $status = 200, array $headers = [])
    {
        return response()->json([
            'success' => true,
            'data' => $data
        ], $status, $headers);
    }

    /**
     * error
     *
     * @param string $errMsg
     * @param array $errors
     * @param int $status
     * @param array $headers
     * @return \Illuminate\Http\JsonResponse
     */
    protected function error(string $errMsg = "", array $errors = [], $status = 200, array $headers = [])
    {
        return response()->json([
            'success' => false,
            'errMsg' => $errMsg,
            'errors' => $errors,
        ], $status, $headers);
    }
}