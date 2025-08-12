export interface HealthMetric {
  id: string;
  date: Date;
  weight?: number;
  muscleMass?: number;
  fatMass?: number;
  bmi?: number;
  fatPercentage?: number;
}

export interface Goal {
  id: string;
  type: 'weight' | 'muscleMass' | 'fatMass' | 'bmi' | 'fatPercentage';
  targetValue: number;
  targetDate: Date;
  currentValue?: number;
  weeklyGoals: WeeklyGoal[];
  monthlyGoals: MonthlyGoal[];
}

export interface WeeklyGoal {
  weekStart: Date;
  weekEnd: Date;
  targetValue: number;
  achieved: boolean;
  actualValue?: number;
}

export interface MonthlyGoal {
  month: number;
  year: number;
  targetValue: number;
  achieved: boolean;
  actualValue?: number;
}

export type MetricType = 'weight' | 'muscleMass' | 'fatMass' | 'bmi' | 'fatPercentage';

export interface MetricInfo {
  label: string;
  unit: string;
  icon: string;
  color: string;
}