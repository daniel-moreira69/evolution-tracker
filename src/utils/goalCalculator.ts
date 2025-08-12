import { Goal, WeeklyGoal, MonthlyGoal } from "@/types/health";

export function calculateIntermediateGoals(goal: Goal): { weeklyGoals: WeeklyGoal[], monthlyGoals: MonthlyGoal[] } {
  const startDate = new Date();
  const endDate = new Date(goal.targetDate);
  const startValue = goal.currentValue || 0;
  const targetValue = goal.targetValue;
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.ceil(totalDays / 7);
  const totalChange = targetValue - startValue;
  
  // Calculate weekly goals
  const weeklyGoals: WeeklyGoal[] = [];
  for (let week = 0; week < totalWeeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

    const progressRatio = (week + 1) / totalWeeks; // end-of-week target
    const weeklyTargetValue = startValue + (totalChange * progressRatio);
    
    weeklyGoals.push({
      weekStart,
      weekEnd,
      targetValue: weeklyTargetValue,
      achieved: false,
      actualValue: undefined,
    });
  }
  
  // Calculate monthly goals
  const monthlyGoals: MonthlyGoal[] = [];
  const currentMonth = startDate.getMonth();
  const currentYear = startDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endYear = endDate.getFullYear();
  
  let month = currentMonth;
  let year = currentYear;
  
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthsDiff = (year - currentYear) * 12 + (month - currentMonth);
    const totalMonths = (endYear - currentYear) * 12 + (endMonth - currentMonth) + 1; // inclusive of last month

    const progressRatio = (monthsDiff + 1) / totalMonths; // end-of-month target
    const monthlyTargetValue = startValue + (totalChange * progressRatio);

    monthlyGoals.push({
      month: month + 1,
      year,
      targetValue: monthlyTargetValue,
      achieved: false,
      actualValue: undefined,
    });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  
  return { weeklyGoals, monthlyGoals };
}

export function updateGoalProgress(goal: Goal, currentValue: number): Goal {
  const updatedWeeklyGoals = goal.weeklyGoals.map(weeklyGoal => {
    const now = new Date();
    if (now >= weeklyGoal.weekEnd) {
      return {
        ...weeklyGoal,
        achieved: isGoalAchieved(goal.type, currentValue, weeklyGoal.targetValue)
      };
    }
    return weeklyGoal;
  });
  
  const updatedMonthlyGoals = goal.monthlyGoals.map(monthlyGoal => {
    const now = new Date();
    const goalMonth = new Date(monthlyGoal.year, monthlyGoal.month - 1, 1);
    const nextMonth = new Date(monthlyGoal.year, monthlyGoal.month, 1);
    
    if (now >= nextMonth) {
      return {
        ...monthlyGoal,
        achieved: isGoalAchieved(goal.type, currentValue, monthlyGoal.targetValue)
      };
    }
    return monthlyGoal;
  });
  
  return {
    ...goal,
    currentValue,
    weeklyGoals: updatedWeeklyGoals,
    monthlyGoals: updatedMonthlyGoals
  };
}

export function isGoalAchieved(goalType: string, currentValue: number, targetValue: number): boolean {
  const tolerance = 0.1; // 0.1 kg/unit tolerance
  switch (goalType) {
    case 'weight':
    case 'fatMass':
    case 'fatPercentage':
    case 'bmi':
      // Down is good
      return currentValue <= targetValue + tolerance;
    case 'muscleMass':
      // Up is good
      return currentValue >= targetValue - tolerance;
    default:
      return Math.abs(currentValue - targetValue) <= tolerance;
  }
}