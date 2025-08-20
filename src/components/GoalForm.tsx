import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, MetricType } from "@/types/health";
import { goalSchema, sanitizeNumericInput, formatValidationError } from "@/utils/validation";
import { Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      if (!formData.type || !formData.targetValue || !formData.targetDate) {
        throw new Error('Todos os campos são obrigatórios');
      }
      
      const goal = {
        type: formData.type,
        targetValue: parseFloat(sanitizeNumericInput(formData.targetValue)),
        targetDate: new Date(formData.targetDate),
        currentValue: currentValues[formData.type]
      };
      
      // Validate the goal data
      const validatedGoal = goalSchema.parse(goal);
      
      onAddGoal(validatedGoal as Omit<Goal, 'id' | 'weeklyGoals' | 'monthlyGoals'>);
      setIsOpen(false);
      setFormData({
        type: '' as MetricType,
        targetValue: '',
        targetDate: ''
      });
      toast.success('Meta criada com sucesso!');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const formattedErrors = formatValidationError(error);
        setErrors(formattedErrors);
        toast.error('Verifique os dados da meta');
      } else {
        toast.error(error.message || 'Erro ao criar meta');
        console.error('Failed to add goal:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    setFormData({ ...formData, [field]: value });
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
          {Object.keys(errors).length > 0 && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {Object.values(errors)[0]}
              </AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="type">Métrica</Label>
            <Select value={formData.type} onValueChange={(value: MetricType) => handleInputChange('type', value)}>
              <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione uma métrica" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
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
              type="text"
              inputMode="decimal"
              placeholder="Ex: 75.0"
              value={formData.targetValue}
              onChange={(e) => handleInputChange('targetValue', sanitizeNumericInput(e.target.value))}
              className={errors.targetValue ? 'border-destructive' : ''}
              required
            />
            {errors.targetValue && <p className="text-sm text-destructive mt-1">{errors.targetValue}</p>}
          </div>
          
          <div>
            <Label htmlFor="targetDate">Data da Meta</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => handleInputChange('targetDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className={errors.targetDate ? 'border-destructive' : ''}
              required
            />
            {errors.targetDate && <p className="text-sm text-destructive mt-1">{errors.targetDate}</p>}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-gradient-accent" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Meta'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}