<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use Illuminate\Http\Request;

class HabitController extends Controller
{
    public function index(Request $request)
    {
        $habits = $request->user()->habits()->withCount([
            'logs as total_logs',
            'logs as completed_logs' => fn($q) => $q->where('completed', true),
        ])->get();

        return response()->json($habits);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:191',
            'description' => 'nullable|string',
            'type'        => 'required|in:daily,monthly,yearly',
            'action'      => 'in:build,break',
            'category'    => 'nullable|string|max:191',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $habit = $request->user()->habits()->create($data);

        return response()->json($habit, 201);
    }

    public function show(Request $request, Habit $habit)
    {
        $this->authorize($request->user(), $habit);
        $habit->load('logs');
        $habit->streak = $habit->streak();
        return response()->json($habit);
    }

    public function update(Request $request, Habit $habit)
    {
        $this->authorize($request->user(), $habit);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:191',
            'description' => 'nullable|string',
            'type'        => 'sometimes|in:daily,monthly,yearly',
            'action'      => 'sometimes|in:build,break',
            'category'    => 'nullable|string|max:191',
            'is_active'   => 'sometimes|boolean',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
        ]);

        $habit->update($data);

        return response()->json($habit);
    }

    public function destroy(Request $request, Habit $habit)
    {
        $this->authorize($request->user(), $habit);
        $habit->delete();
        return response()->json(['message' => 'Habit deleted.']);
    }

    private function authorize($user, Habit $habit): void
    {
        abort_if($habit->user_id !== $user->id, 403, 'Forbidden.');
    }
}
