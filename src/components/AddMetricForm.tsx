import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthMetric } from "@/types/health";
import { healthMetricSchema, sanitizeNumericInput, formatValidationError } from "@/utils/validation";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AddMetricFormProps {
  onAddMetric: (metric: Omit<HealthMetric, 'id'>) => void;
}

export function AddMetricForm({ onAddMetric }: AddMetricFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    muscleMass: '',
    fatMass: '',
    bmi: '',
    fatPercentage: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const metric: Omit<HealthMetric, 'id'> = {
        date: new Date(formData.date),
        weight: formData.weight ? parseFloat(sanitizeNumericInput(formData.weight)) : undefined,
        muscleMass: formData.muscleMass ? parseFloat(sanitizeNumericInput(formData.muscleMass)) : undefined,
        fatMass: formData.fatMass ? parseFloat(sanitizeNumericInput(formData.fatMass)) : undefined,
        bmi: formData.bmi ? parseFloat(sanitizeNumericInput(formData.bmi)) : undefined,
        fatPercentage: formData.fatPercentage ? parseFloat(sanitizeNumericInput(formData.fatPercentage)) : undefined,
      };
      
      // Validate the data
      const validatedMetric = healthMetricSchema.parse(metric);
      
      onAddMetric(validatedMetric as Omit<HealthMetric, 'id'>);
      setIsOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        muscleMass: '',
        fatMass: '',
        bmi: '',
        fatPercentage: ''
      });
      toast.success('Medição adicionada com sucesso!');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const formattedErrors = formatValidationError(error);
        setErrors(formattedErrors);
        toast.error('Verifique os dados inseridos');
      } else {
        toast.error('Erro ao salvar medição');
        console.error('Failed to add metric:', error);
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
    
    // Sanitize numeric inputs
    if (field !== 'date') {
      value = sanitizeNumericInput(value);
    }
    
    setFormData({ ...formData, [field]: value });
  };

  if (!isOpen) {
    return (
      <Card className="shadow-soft border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer" 
            onClick={() => setIsOpen(true)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Adicionar nova medição</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Nova Medição</CardTitle>
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
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={errors.date ? 'border-destructive' : ''}
              required
            />
            {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg) <span className="text-xs text-muted-foreground">(20-300kg)</span></Label>
              <Input
                id="weight"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 75.5"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className={errors.weight ? 'border-destructive' : ''}
              />
              {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight}</p>}
            </div>
            
            <div>
              <Label htmlFor="muscleMass">Massa Muscular (kg) <span className="text-xs text-muted-foreground">(5-150kg)</span></Label>
              <Input
                id="muscleMass"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 35.2"
                value={formData.muscleMass}
                onChange={(e) => handleInputChange('muscleMass', e.target.value)}
                className={errors.muscleMass ? 'border-destructive' : ''}
              />
              {errors.muscleMass && <p className="text-sm text-destructive mt-1">{errors.muscleMass}</p>}
            </div>
            
            <div>
              <Label htmlFor="fatMass">Massa de Gordura (kg) <span className="text-xs text-muted-foreground">(1-200kg)</span></Label>
              <Input
                id="fatMass"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 15.8"
                value={formData.fatMass}
                onChange={(e) => handleInputChange('fatMass', e.target.value)}
                className={errors.fatMass ? 'border-destructive' : ''}
              />
              {errors.fatMass && <p className="text-sm text-destructive mt-1">{errors.fatMass}</p>}
            </div>
            
            <div>
              <Label htmlFor="bmi">IMC <span className="text-xs text-muted-foreground">(10-60)</span></Label>
              <Input
                id="bmi"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 23.5"
                value={formData.bmi}
                onChange={(e) => handleInputChange('bmi', e.target.value)}
                className={errors.bmi ? 'border-destructive' : ''}
              />
              {errors.bmi && <p className="text-sm text-destructive mt-1">{errors.bmi}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="fatPercentage">% de Gordura <span className="text-xs text-muted-foreground">(2-70%)</span></Label>
            <Input
              id="fatPercentage"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 18.5"
              value={formData.fatPercentage}
              onChange={(e) => handleInputChange('fatPercentage', e.target.value)}
              className={errors.fatPercentage ? 'border-destructive' : ''}
            />
            {errors.fatPercentage && <p className="text-sm text-destructive mt-1">{errors.fatPercentage}</p>}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Medição'}
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