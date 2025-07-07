<?php

namespace App\Base\Http\Controllers\Auth;

use App\Base\Http\Controllers\Controller;
use App\Base\Providers\RouteServiceProvider;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;

/**
 * ログイン
 */
class LoginController extends Controller
{
    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = RouteServiceProvider::HOME;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except('logout');
    }

    public function username()
    {
        return 'login_id';
    }

    protected function validateLogin(Request $request)
    {
        $request->validate([
            $this->username() => 'required|string|max:10',
            'password' => 'required|string|max:20',
        ],  [
            $this->username() . '.required' => 'IDが未入力です。',
            $this->username() . '.max' => 'IDは、:max文字以下で指定してください。',
            'password.required' => 'パスワードが未入力です。'
        ]);
    }
}
