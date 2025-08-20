<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Survey extends Model {
  protected $fillable = ['title','year','semester','is_active','open_from','open_until'];
  public function services(){ return $this->hasMany(SurveyService::class); }
  public function questions(){ return $this->hasMany(SurveyQuestion::class); }
}
