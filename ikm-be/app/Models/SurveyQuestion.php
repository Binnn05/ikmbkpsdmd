<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model {
  protected $fillable = ['survey_id','code','label','type','min','max','required','order_idx'];
}
