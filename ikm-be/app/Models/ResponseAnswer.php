<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResponseAnswer extends Model
{
    protected $table = 'response_answers';

    protected $fillable = [
        'response_id',
        'question_code',
        'value',
        'text_value',
    ];

    public function response()
    {
        return $this->belongsTo(Response::class, 'response_id');
    }
}
