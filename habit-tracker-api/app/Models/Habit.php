<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Habit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'title', 'description', 'type',
        'action', 'category', 'is_active', 'start_date', 'end_date',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function logs()
    {
        return $this->hasMany(HabitLog::class);
    }

    public function streak(): int
    {
        $logs = $this->logs()
            ->where('completed', true)
            ->orderByDesc('log_date')
            ->pluck('log_date')
            ->map(fn($d) => \Carbon\Carbon::parse($d));

        $streak = 0;
        $check = \Carbon\Carbon::today();

        foreach ($logs as $date) {
            if ($date->isSameDay($check) || $date->isSameDay($check->copy()->subDay())) {
                $streak++;
                $check = $date;
            } else {
                break;
            }
        }

        return $streak;
    }
}
