import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, MetricType } from "@/types/health";
import { Target } from "lucide-react";

interface GoalFormProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'weeklyGoals' | 'monthlyGoals'>) => void;
  currentValues: Record<MetricType, number | undefined>;
}

const metricLabels: Record<MetricType, string> = {
  weight: 'Peso (kg)',
  muscleMass: 'Massa Muscular (kg)',
  fatMass: 'Massa de Gordura (kg)',
  bmi: 'IMC',
  fatPercentage: '% de Gordura'
};

export function GoalForm({ onAddGoal, currentValues }: GoalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '' as MetricType,
    targetValue: '',
    targetDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.targetValue || !formData.targetDate) return;
    
    const goal = {
      type: formData.type,
      targetValue: parseFloat(formData.targetValue),
      targetDate: new Date(formData.targetDate),
      currentValue: currentValues[formData.type]
    };
    
    onAddGoal(goal);
    setIsOpen(false);
    setFormData({
      type: '' as MetricType,
      targetValue: '',
      targetDate: ''
    });
  };

  if (!isOpen) {
    return (
      <Card className="shadow-soft border-dashed border-2 border-muted-foreground/25 hover:border-accent/50 transition-colors cursor-pointer" 
            onClick={() => setIsOpen(true)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Target className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Definir nova meta</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Nova Meta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Métrica</Label>
            <Select value={formData.type} onValueChange={(value: MetricType) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma métrica" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {formData.type && currentValues[formData.type] && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Valor atual: {currentValues[formData.type]?.toFixed(1)} {formData.type === 'weight' || formData.type === 'muscleMass' || formData.type === 'fatMass' ? 'kg' : formData.type === 'fatPercentage' ? '%' : ''}
            </div>
          )}
          
          <div>
            <Label htmlFor="targetValue">Valor da Meta</Label>
            <Input
              id="targetValue"
              type="number"
              step="0.1"
              placeholder="Ex: 75.0"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="targetDate">Data da Meta</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-gradient-accent">
              Criar Meta
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}