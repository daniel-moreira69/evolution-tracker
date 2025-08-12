import { Goal, MetricType } from "@/types/health";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoalAchieved } from "@/utils/goalCalculator";

interface GoalBreakdownProps {
  goal: Goal;
  onUpdate: (updated: Goal) => void;
}

const unitsByType: Record<MetricType, string> = {
  weight: 'kg',
  muscleMass: 'kg',
  fatMass: 'kg',
  bmi: '',
  fatPercentage: '%'
};

function formatWeekRange(start: Date, end: Date) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  return `${s.toLocaleDateString('pt-BR', opts)} - ${e.toLocaleDateString('pt-BR', opts)}`;
}

function desiredIsDown(type: MetricType) {
  return type === 'weight' || type === 'fatMass' || type === 'fatPercentage' || type === 'bmi';
}

export function GoalBreakdown({ goal, onUpdate }: GoalBreakdownProps) {
  const unit = unitsByType[goal.type];

  const updateWeekly = (index: number, value?: number) => {
    const weeklyGoals = goal.weeklyGoals.map((w, i) => {
      if (i !== index) return w;
      const actualValue = value;
      const achieved = actualValue != null ? isGoalAchieved(goal.type, actualValue, w.targetValue) : w.achieved;
      return { ...w, actualValue, achieved };
    });
    onUpdate({ ...goal, weeklyGoals });
  };

  const updateMonthly = (index: number, value?: number) => {
    const monthlyGoals = goal.monthlyGoals.map((m, i) => {
      if (i !== index) return m;
      const actualValue = value;
      const achieved = actualValue != null ? isGoalAchieved(goal.type, actualValue, m.targetValue) : m.achieved;
      return { ...m, actualValue, achieved };
    });
    onUpdate({ ...goal, monthlyGoals });
  };

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="weekly">Semanas</TabsTrigger>
        <TabsTrigger value="monthly">Meses</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {goal.weeklyGoals.map((w, i) => {
                const diff = w.actualValue != null ? w.actualValue - w.targetValue : undefined;
                const goodDirectionDown = desiredIsDown(goal.type);
                const statusGood = w.actualValue != null ? isGoalAchieved(goal.type, w.actualValue, w.targetValue) : undefined;
                return (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center p-3">
                    <div className="col-span-4">
                      <Label className="text-sm">{formatWeekRange(w.weekStart, w.weekEnd)}</Label>
                      <div className="text-xs text-muted-foreground">Meta: {w.targetValue.toFixed(1)} {unit}</div>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Fechamento</Label>
                      <Input
                        type="number"
                        step="0.1"
                        defaultValue={w.actualValue ?? ''}
                        onBlur={(e) => {
                          const v = e.currentTarget.value ? parseFloat(e.currentTarget.value) : undefined;
                          updateWeekly(i, v);
                        }}
                      />
                    </div>
                    <div className="col-span-5">
                      {w.actualValue != null ? (
                        <div className={`text-sm font-medium ${statusGood ? 'text-success' : 'text-destructive'}`}>
                          {statusGood ? 'Dentro da meta' : 'Fora da meta'}
                          <span className="text-muted-foreground ml-2">
                            ({goodDirectionDown ? (diff! <= 0 ? 'abaixo' : 'acima') : (diff! >= 0 ? 'acima' : 'abaixo')} {Math.abs(diff!).toFixed(1)} {unit})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Insira o fechamento para ver o status</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="monthly">
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {goal.monthlyGoals.map((m, i) => {
                const date = new Date(m.year, m.month - 1, 1);
                const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                const diff = m.actualValue != null ? m.actualValue - m.targetValue : undefined;
                const goodDirectionDown = desiredIsDown(goal.type);
                const statusGood = m.actualValue != null ? isGoalAchieved(goal.type, m.actualValue, m.targetValue) : undefined;
                return (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center p-3">
                    <div className="col-span-4">
                      <Label className="text-sm capitalize">{label}</Label>
                      <div className="text-xs text-muted-foreground">Meta: {m.targetValue.toFixed(1)} {unit}</div>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Fechamento</Label>
                      <Input
                        type="number"
                        step="0.1"
                        defaultValue={m.actualValue ?? ''}
                        onBlur={(e) => {
                          const v = e.currentTarget.value ? parseFloat(e.currentTarget.value) : undefined;
                          updateMonthly(i, v);
                        }}
                      />
                    </div>
                    <div className="col-span-5">
                      {m.actualValue != null ? (
                        <div className={`text-sm font-medium ${statusGood ? 'text-success' : 'text-destructive'}`}>
                          {statusGood ? 'Dentro da meta' : 'Fora da meta'}
                          <span className="text-muted-foreground ml-2">
                            ({goodDirectionDown ? (diff! <= 0 ? 'abaixo' : 'acima') : (diff! >= 0 ? 'acima' : 'abaixo')} {Math.abs(diff!).toFixed(1)} {unit})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Insira o fechamento para ver o status</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
