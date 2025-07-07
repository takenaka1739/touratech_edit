<?php

namespace App\Base\Http\Requests\Api;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

  protected function failedValidation(Validator $validator)
	{
		$res = response()->json([
			'success' => false,
			'errors' => $validator->errors(),
		], 200);
		throw new HttpResponseException($res);
	}
}