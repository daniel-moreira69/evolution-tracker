import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Goal, MetricType } from "@/types/health";
import { GoalBreakdown } from "./GoalBreakdown";

const metricLabel: Record<MetricType, string> = {
  weight: 'Peso',
  muscleMass: 'Massa Muscular',
  fatMass: 'Massa de Gordura',
  bmi: 'IMC',
  fatPercentage: '% de Gordura'
};

interface GoalsPanelProps {
  goals: Goal[];
  onUpdateGoal: (updated: Goal) => void;
}

export function GoalsPanel({ goals, onUpdateGoal }: GoalsPanelProps) {
  if (!goals.length) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Metas Detalhadas</h2>
      <Accordion type="multiple" className="w-full">
        {goals.map((g) => (
          <AccordionItem key={g.id} value={g.id}>
            <AccordionTrigger>
              <div className="flex flex-col items-start">
                <span className="font-medium">{metricLabel[g.type]}</span>
                <span className="text-xs text-muted-foreground">
                  Objetivo: {g.targetValue.toFixed(1)} até {new Date(g.targetDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <GoalBreakdown goal={g} onUpdate={onUpdateGoal} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
