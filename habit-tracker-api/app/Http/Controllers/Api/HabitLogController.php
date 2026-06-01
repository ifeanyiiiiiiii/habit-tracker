<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Models\HabitLog;
use Illuminate\Http\Request;

class HabitLogController extends Controller
{
    public function index(Request $request, Habit $habit)
    {
        abort_if($habit->user_id !== $request->user()->id, 403);

        $logs = $habit->logs()->orderByDesc('log_date')->get();
        return response()->json($logs);
    }

    public function toggle(Request $request, Habit $habit)
    {
        abort_if($habit->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'log_date' => 'required|date',
            'note'     => 'nullable|string',
        ]);

        $log = HabitLog::updateOrCreate(
            ['habit_id' => $habit->id, 'log_date' => $data['log_date']],
            ['completed' => true, 'note' => $data['note'] ?? null]
        );

        $habit->streak = $habit->streak();

        return response()->json(['log' => $log, 'streak' => $habit->streak]);
    }

    public function uncheck(Request $request, Habit $habit)
    {
        abort_if($habit->user_id !== $request->user()->id, 403);

        $date = $request->validate(['log_date' => 'required|date'])['log_date'];

        HabitLog::where('habit_id', $habit->id)
            ->where('log_date', $date)
            ->update(['completed' => false]);

        return response()->json(['message' => 'Unchecked.']);
    }
}

