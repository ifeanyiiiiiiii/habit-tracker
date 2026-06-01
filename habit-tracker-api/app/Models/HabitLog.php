<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HabitLog extends Model
{
    protected $fillable = ['habit_id', 'log_date', 'completed', 'note'];

    protected $casts = [
        'completed' => 'boolean',
        'log_date' => 'date',
    ];

    public function habit()
    {
        return $this->belongsTo(Habit::class);
    }
}

