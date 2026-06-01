export interface User {
  id: number;
  name: string;
  email: string;
}

export type HabitType = 'daily' | 'monthly' | 'yearly';
export type HabitAction = 'build' | 'break';

export interface Habit {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  type: HabitType;
  action: HabitAction;
  category?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  streak?: number;
  total_logs?: number;
  completed_logs?: number;
  created_at: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  log_date: string;
  completed: boolean;
  note?: string;
}

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Milestone {
  title: string;
  done: boolean;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  target_date: string;
  milestones?: Milestone[];
  status: GoalStatus;
  created_at: string;
}
