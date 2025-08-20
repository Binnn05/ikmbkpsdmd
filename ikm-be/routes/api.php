<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{PublicController, AdminSurveyController, AuthController};

// Auth (public)
Route::post('/auth/login', [AuthController::class, 'login']);

// Public
Route::prefix('public')->group(function () {
    Route::get('/surveys/active', [PublicController::class,'active']);
    Route::get('/public/surveys', [PublicController::class,'byPeriod']);
    Route::get('/analytics',      [PublicController::class,'analytics']);
    Route::post('/responses',     [PublicController::class,'storeResponse']);
});

// Admin (pakai Sanctum kalau sudah siap)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/surveys',                [AdminSurveyController::class,'index']);
    Route::get('/surveys/{id}',           [AdminSurveyController::class,'show'])->whereNumber('id');
    Route::post('/surveys/{id}/services', [AdminSurveyController::class,'upsertServices'])->whereNumber('id');
    Route::post('/surveys/{id}/questions',[AdminSurveyController::class,'upsertQuestions'])->whereNumber('id');
    Route::patch('/surveys/{id}',         [AdminSurveyController::class,'update'])->whereNumber('id');
    Route::get('/surveys/{id}/summary',   [AdminSurveyController::class,'summary'])->whereNumber('id');
    Route::get('/surveys/{id}/export',    [AdminSurveyController::class,'export'])->whereNumber('id');
    Route::get('/surveys/{id}/responses', [AdminSurveyController::class,'responses'])->whereNumber('id');
    Route::patch('/responses/{id}',       [AdminSurveyController::class,'updateResponse'])->whereNumber('id');
    Route::delete('/responses/{id}',      [AdminSurveyController::class,'deleteResponse'])->whereNumber('id');
});

Route::options('/{any}', fn () => response()->noContent())
    ->where('any', '.*');