<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\HabitController;
use App\Http\Controllers\Api\HabitLogController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/me',      [AuthController::class, 'updateProfile']);

    // Habits
    Route::apiResource('habits', HabitController::class);

    // Habit logs (check/uncheck)
    Route::get('/habits/{habit}/logs',     [HabitLogController::class, 'index']);
    Route::post('/habits/{habit}/toggle',  [HabitLogController::class, 'toggle']);
    Route::post('/habits/{habit}/uncheck', [HabitLogController::class, 'uncheck']);

    // Goals
    Route::apiResource('goals', GoalController::class);
});
