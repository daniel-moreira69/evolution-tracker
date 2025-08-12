import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HealthMetric } from "@/types/health";
import { Plus } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const metric: Omit<HealthMetric, 'id'> = {
      date: new Date(formData.date),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
      fatMass: formData.fatMass ? parseFloat(formData.fatMass) : undefined,
      bmi: formData.bmi ? parseFloat(formData.bmi) : undefined,
      fatPercentage: formData.fatPercentage ? parseFloat(formData.fatPercentage) : undefined,
    };
    
    onAddMetric(metric);
    setIsOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      muscleMass: '',
      fatMass: '',
      bmi: '',
      fatPercentage: ''
    });
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
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
              <Input
                id="muscleMass"
                type="number"
                step="0.1"
                placeholder="Ex: 35.2"
                value={formData.muscleMass}
                onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="fatMass">Massa de Gordura (kg)</Label>
              <Input
                id="fatMass"
                type="number"
                step="0.1"
                placeholder="Ex: 15.8"
                value={formData.fatMass}
                onChange={(e) => setFormData({ ...formData, fatMass: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="bmi">IMC</Label>
              <Input
                id="bmi"
                type="number"
                step="0.1"
                placeholder="Ex: 23.5"
                value={formData.bmi}
                onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="fatPercentage">% de Gordura</Label>
            <Input
              id="fatPercentage"
              type="number"
              step="0.1"
              placeholder="Ex: 18.5"
              value={formData.fatPercentage}
              onChange={(e) => setFormData({ ...formData, fatPercentage: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-gradient-primary">
              Salvar Medição
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