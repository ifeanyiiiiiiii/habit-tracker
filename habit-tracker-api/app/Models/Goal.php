<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Goal extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'title', 'description',
        'target_date', 'milestones', 'status',
    ];

    protected $casts = [
        'target_date' => 'date',
        'milestones' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
