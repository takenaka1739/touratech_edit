<?php

namespace App\Base\Providers;

use App\Base\Notifications\FailedLoginNotification;
use App\Base\Notifications\SuccessfulLoginNotification;
use Illuminate\Support\ServiceProvider;

class NotifiationServiceProvider extends ServiceProvider
{
    /** @var string */
    protected $failedEvent = 'Illuminate\Auth\Events\Failed';

    /** @var string */
    protected $successEvent = 'Illuminate\Auth\Events\Login';

    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        $this->app['events']->listen($this->failedEvent, function ($event) {
            if (isset($event->user) && is_a($event->user, 'Illuminate\Database\Eloquent\Model')) {
                $event->user->notify(new FailedLoginNotification(
                    $this->app['request']->ip()
                ));
            }
        });

        $this->app['events']->listen($this->successEvent, function ($event) {
            if (isset($event->user) && is_a($event->user, 'Illuminate\Database\Eloquent\Model')) {
                $event->user->notify(new SuccessfulLoginNotification(
                    $this->app['request']->ip()
                ));
            }
        });
    }
}
