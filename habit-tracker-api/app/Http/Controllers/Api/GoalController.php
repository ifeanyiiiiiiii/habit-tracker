<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->goals()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:191',
            'description' => 'nullable|string',
            'target_date' => 'required|date',
            'milestones'  => 'nullable|array',
        ]);

        $goal = $request->user()->goals()->create($data);

        return response()->json($goal, 201);
    }

    public function show(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);
        return response()->json($goal);
    }

    public function update(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:191',
            'description' => 'nullable|string',
            'target_date' => 'sometimes|date',
            'milestones'  => 'nullable|array',
            'status'      => 'sometimes|in:active,completed,abandoned',
        ]);

        $goal->update($data);

        return response()->json($goal);
    }

    public function destroy(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);
        $goal->delete();
        return response()->json(['message' => 'Goal deleted.']);
    }
}

