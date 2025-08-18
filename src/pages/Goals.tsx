import { useState, useEffect } from "react";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalForm } from "@/components/GoalForm";
import { GoalBreakdown } from "@/components/GoalBreakdown";
import { Goal } from "@/types/health";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const savedGoals = localStorage.getItem('healthGoals');
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setGoals(parsedGoals.map((g: any) => ({
        ...g,
        targetDate: new Date(g.targetDate),
        weeklyGoals: g.weeklyGoals?.map((w: any) => ({
          ...w,
          weekStart: new Date(w.weekStart),
          weekEnd: new Date(w.weekEnd)
        })) || [],
        monthlyGoals: g.monthlyGoals || []
      })));
    }
  }, []);

  const addGoal = (goal: Goal) => {
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('healthGoals', JSON.stringify(updatedGoals));
    setShowAddForm(false);
  };

  const updateGoal = (updated: Goal) => {
    const updatedGoals = goals.map(g => g.id === updated.id ? updated : g);
    setGoals(updatedGoals);
    localStorage.setItem('healthGoals', JSON.stringify(updatedGoals));
  };

  const removeGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem('healthGoals', JSON.stringify(updatedGoals));
  };

  const getProgressPercentage = (goal: Goal) => {
    if (!goal.currentValue) return 0;
    return Math.min(Math.max((goal.currentValue / goal.targetValue) * 100, 0), 100);
  };

  const getStatusColor = (goal: Goal) => {
    const progress = getProgressPercentage(goal);
    const daysLeft = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) return "success";
    if (daysLeft < 0) return "destructive";
    if (progress >= 70) return "success";
    if (progress >= 40) return "warning";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-oswald font-bold text-primary">
              Metas de Saúde
            </h1>
            <p className="text-muted-foreground font-rajdhani">
              Defina e acompanhe seus objetivos de fitness
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardHeader>
              <CardTitle className="text-primary font-oswald">Criar Nova Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalForm 
                onAddGoal={(goalData) => {
                  const newGoal = {
                    ...goalData,
                    id: Date.now().toString(),
                    weeklyGoals: [],
                    monthlyGoals: []
                  };
                  addGoal(newGoal);
                }}
                currentValues={{
                  weight: undefined,
                  muscleMass: undefined,
                  fatMass: undefined,
                  bmi: undefined,
                  fatPercentage: undefined
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-dark border-border/50 shadow-intense">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-primary font-oswald">
                      {getMetricLabel(goal.type)}
                    </CardTitle>
                  </div>
                  <Badge variant={getStatusColor(goal) as any}>
                    {getProgressPercentage(goal).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-rajdhani">Meta:</p>
                    <p className="text-foreground font-oswald font-bold">
                      {goal.targetValue.toFixed(1)}{getMetricUnit(goal.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-rajdhani">Atual:</p>
                    <p className="text-foreground font-oswald font-bold">
                      {goal.currentValue?.toFixed(1) || '--'}{getMetricUnit(goal.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-rajdhani">Prazo:</p>
                    <p className="text-foreground font-rajdhani">
                      {goal.targetDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-rajdhani">Restam:</p>
                    <p className="text-foreground font-rajdhani">
                      {Math.max(0, Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30">
                  <GoalBreakdown goal={goal} onUpdate={updateGoal} />
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => removeGoal(goal.id)}
                  >
                    Excluir Meta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {goals.length === 0 && !showAddForm && (
          <Card className="bg-gradient-dark border-border/50 shadow-intense">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-oswald font-bold text-foreground mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-muted-foreground text-center mb-6 font-rajdhani">
                Comece definindo suas metas de saúde e fitness para acompanhar seu progresso
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar primeira meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getMetricLabel(type: string): string {
  const labels: Record<string, string> = {
    weight: 'Peso',
    muscleMass: 'Massa Muscular',
    fatMass: 'Massa de Gordura',
    bmi: 'IMC',
    fatPercentage: '% de Gordura'
  };
  return labels[type] || type;
}

function getMetricUnit(type: string): string {
  const units: Record<string, string> = {
    weight: 'kg',
    muscleMass: 'kg',
    fatMass: 'kg',
    bmi: '',
    fatPercentage: '%'
  };
  return units[type] || '';
}