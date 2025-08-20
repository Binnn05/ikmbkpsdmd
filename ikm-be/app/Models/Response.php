<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Response extends Model
{
    protected $table = 'responses';

    protected $fillable = [
        'survey_id', 'service_id',
        'client_ip', 'user_agent',
        'gender', 'status', 'usia', 'pendidikan',
    ];

    public function answers()
    {
        return $this->hasMany(ResponseAnswer::class, 'response_id');
    }
}
