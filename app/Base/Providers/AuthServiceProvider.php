<?php

namespace App\Base\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Gate::define('role-general', function($user) {
            return $user->isGeneral();
        });
        Gate::define('role-admin', function($user) {
            return $user->isAdmin();
        });
        Gate::define('role-other', function($user) {
            return $user->isOther();
        });
    }
}
