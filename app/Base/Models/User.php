<?php

namespace App\Base\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
  use Notifiable, SoftDeletes;

  protected $table = 'm_personnels';

  const ROLE_GENERAL = 0;
  const ROLE_ADMIN = 1;
  const ROLE_OTHER = 2;

  protected $fillable = [
    'name',
    'login_id',
    'password',
    'role',
  ];

  protected $hidden = [
    'password',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  /**
   * 一般
   *
   * @return boolean
   */
  public function isGeneral()
  {
    return $this->role === self::ROLE_GENERAL;
  }

  /**
   * 管理者
   *
   * @return boolean
   */
  public function isAdmin()
  {
    return $this->role === self::ROLE_ADMIN;
  }

  /**
   * 外部
   *
   * @return boolean
   */
  public function isOther()
  {
    return $this->role === self::ROLE_OTHER;
  }
}
