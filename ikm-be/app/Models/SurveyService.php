<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SurveyService extends Model {
  protected $fillable = ['survey_id','name','order_idx'];
  public function survey(){ return $this->belongsTo(Survey::class); }
}
