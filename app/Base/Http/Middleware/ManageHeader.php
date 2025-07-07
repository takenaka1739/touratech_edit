<?php

namespace App\Base\Http\Middleware;

use Closure;

class ManageHeader
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
    header_register_callback(function() {
      header_remove('X-Powered-By');
    });

    $response = $next($request);
    return $response;
  }
}