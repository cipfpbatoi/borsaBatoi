<?php

namespace App\Entities;

use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    protected $fillable = [
        'email', 'token'
    ];

    public $timestamps=false;

}
