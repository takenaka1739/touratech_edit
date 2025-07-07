<?php

namespace App\Base\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\UnauthorizedException;

class CheckGeneral
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $guard
     * @return mixed
     */
    public function handle($request, Closure $next, $guard = null)
    {
        if (!(Gate::allows('role-general') || Gate::allows('role-admin'))) {
            throw new UnauthorizedException("Unauthenticated.");
        }

        return $next($request);
    }
}
