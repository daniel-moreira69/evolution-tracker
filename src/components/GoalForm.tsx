import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, MetricType } from "@/types/health";
import { goalSchema, sanitizeNumericInput, formatValidationError } from "@/utils/validation";
import { criarMetaComBreakdownMensal } from "@/utils/monthlyGoalCalculator";
import { Target, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";

interface GoalFormProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'weeklyGoals' | 'monthlyGoals'>) => void;
  currentValues: Record<MetricType, number | undefined>;
}

interface BodyCompositionData {
  height: number; // cm
  weight: number;
  muscleMass: number;
  fatMass: number;
  fatPercentage: number;
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
    targetDate: '',
    height: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
      
      // Create monthly breakdown using the new calculation system
      let bodyData: BodyCompositionData | undefined;
      if (formData.height && currentValues.weight && currentValues.muscleMass && 
          currentValues.fatMass && currentValues.fatPercentage) {
        bodyData = {
          height: parseFloat(sanitizeNumericInput(formData.height)),
          weight: currentValues.weight,
          muscleMass: currentValues.muscleMass,
          fatMass: currentValues.fatMass,
          fatPercentage: currentValues.fatPercentage
        };
      }

      const currentValuesWithHeight = {
        ...currentValues,
        height: bodyData?.height
      };

      const { monthlyGoals } = criarMetaComBreakdownMensal(
        formData.type,
        parseFloat(sanitizeNumericInput(formData.targetValue)),
        new Date(formData.targetDate),
        currentValuesWithHeight
      );
      
      // Create goal with monthly breakdown
      const goalWithBreakdown = {
        ...validatedGoal,
        monthlyGoals,
        weeklyGoals: [] // Keep empty for now, focusing on monthly goals
      };
      
      onAddGoal(goalWithBreakdown as any);
      setIsOpen(false);
      setFormData({
        type: '' as MetricType,
        targetValue: '',
        targetDate: '',
        height: ''
      });
      setShowAdvancedOptions(false);
      toast.success('Meta criada com breakdown mensal!');
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

          {/* Advanced Options Toggle */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full mb-3"
            >
              <User className="h-4 w-4 mr-2" />
              {showAdvancedOptions ? 'Ocultar' : 'Mostrar'} Dados Corporais (Cálculo Avançado)
            </Button>
            
            {showAdvancedOptions && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Para cálculo mais preciso das metas mensais, forneça sua altura. 
                  Será usado junto com seus dados corporais atuais.
                </p>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 175"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', sanitizeNumericInput(e.target.value))}
                    className={errors.height ? 'border-destructive' : ''}
                  />
                  {errors.height && <p className="text-sm text-destructive mt-1">{errors.height}</p>}
                </div>
                
                {formData.height && currentValues.weight && currentValues.muscleMass && 
                 currentValues.fatMass && currentValues.fatPercentage && (
                  <div className="text-xs text-success bg-success/10 p-2 rounded">
                    ✓ Cálculo avançado ativado: distribuição otimizada entre perda de gordura (85%) e preservação muscular (15%)
                  </div>
                )}
              </div>
            )}
          </div>
          
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