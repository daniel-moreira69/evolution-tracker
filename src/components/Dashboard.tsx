import { useState, useEffect, useRef } from "react";
import { MetricCard } from "./MetricCard";
import { AddMetricForm } from "./AddMetricForm";
import { GoalForm } from "./GoalForm";
import { MetricChart } from "./MetricChart";
import { GoalProgressChart } from "./GoalProgressChart";
import { HealthMetric, Goal, MetricType } from "@/types/health";
import { calculateIntermediateGoals, updateGoalProgress } from "@/utils/goalCalculator";
import { criarMetaComBreakdownMensal } from "@/utils/monthlyGoalCalculator";
import { SecureStorage, DataRetentionManager } from "@/utils/secureStorage";
import { Weight, Dumbbell, Zap, Activity, Target, TrendingUp, BarChart3, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GoalsPanel } from "./GoalsPanel";
import crossfitBg from "@/assets/crossfit-bg.jpg";
import deadliftSilhouette from "@/assets/deadlift-silhouette.jpg";

const metricIcons = {
  weight: <Weight className="h-5 w-5 text-white" />,
  muscleMass: <Dumbbell className="h-5 w-5 text-white" />,
  fatMass: <Zap className="h-5 w-5 text-white" />,
  bmi: <Activity className="h-5 w-5 text-white" />,
  fatPercentage: <Target className="h-5 w-5 text-white" />
};

const metricColors = {
  weight: "from-primary to-primary-glow",
  muscleMass: "from-accent to-accent-glow", 
  fatMass: "from-warning to-warning",
  bmi: "from-success to-success-glow",
  fatPercentage: "from-destructive to-destructive"
};

const metricLabels = {
  weight: { label: "Peso", unit: "kg" },
  muscleMass: { label: "Massa Muscular", unit: "kg" },
  fatMass: { label: "Massa de Gordura", unit: "kg" },
  bmi: { label: "IMC", unit: "" },
  fatPercentage: { label: "% de Gordura", unit: "%" }
};

export function Dashboard() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from secure storage on component mount
  useEffect(() => {
    try {
      const savedMetrics = SecureStorage.getItem('healthMetrics');
      const savedGoals = SecureStorage.getItem('healthGoals');
      
      if (savedMetrics && Array.isArray(savedMetrics)) {
        const parsedMetrics = savedMetrics.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }));
        setMetrics(parsedMetrics);
      }
      
      if (savedGoals && Array.isArray(savedGoals)) {
        const parsedGoals = savedGoals.map((g: any) => ({
          ...g,
          targetDate: new Date(g.targetDate),
          weeklyGoals: g.weeklyGoals?.map((w: any) => ({
            ...w,
            weekStart: new Date(w.weekStart),
            weekEnd: new Date(w.weekEnd)
          })) || [],
          monthlyGoals: g.monthlyGoals || []
        }));
        setGoals(parsedGoals);
      }
      
      // Run data cleanup on app load
      const { metricsRemoved, goalsRemoved } = DataRetentionManager.cleanupOldData();
      if (metricsRemoved > 0 || goalsRemoved > 0) {
        toast.info(`Dados antigos removidos: ${metricsRemoved} medições, ${goalsRemoved} metas`);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Erro ao carregar dados salvos');
    }
  }, []);

  // Save data to secure storage whenever metrics or goals change
  useEffect(() => {
    try {
      SecureStorage.setItem('healthMetrics', metrics);
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }, [metrics]);

  useEffect(() => {
    try {
      SecureStorage.setItem('healthGoals', goals);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }, [goals]);

  const addMetric = (metricData: Omit<HealthMetric, 'id'>) => {
    const newMetric: HealthMetric = {
      ...metricData,
      id: Date.now().toString()
    };
    
    const updatedMetrics = [...metrics, newMetric].sort((a, b) => b.date.getTime() - a.date.getTime());
    setMetrics(updatedMetrics);
    
    // Update goals with new current values
    const currentValues = getCurrentValues(updatedMetrics);
    const updatedGoals = goals.map(goal => {
      const currentValue = currentValues[goal.type];
      if (currentValue !== undefined) {
        return updateGoalProgress(goal, currentValue);
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString()
    };
    
    setGoals(prev => {
      const others = prev.filter(g => g.type !== newGoal.type);
      return [...others, newGoal];
    });
  };

  const handleExport = () => {
    try {
      const data = { metrics, goals };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `dados-corporais-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (e) {
      toast.error('Falha ao exportar os dados.');
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const parsedMetrics: HealthMetric[] = (json.metrics || []).map((m: any) => ({
        ...m,
        date: new Date(m.date)
      })).sort((a: HealthMetric, b: HealthMetric) => b.date.getTime() - a.date.getTime());

      const parsedGoals: Goal[] = (json.goals || []).map((g: any) => ({
        ...g,
        targetDate: new Date(g.targetDate),
        weeklyGoals: (g.weeklyGoals || []).map((w: any) => ({
          ...w,
          weekStart: new Date(w.weekStart),
          weekEnd: new Date(w.weekEnd)
        })),
        monthlyGoals: g.monthlyGoals || []
      }));

      setMetrics(parsedMetrics);
      setGoals(parsedGoals);

      toast.success('Dados importados com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Arquivo inválido. Verifique o JSON.');
    }
  };

  const onImportClick = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImportFile(file);
      // Reset input to allow re-importing the same file
      e.target.value = '';
    }
  };

  const clearData = () => {
    try {
      SecureStorage.clear();
      setMetrics([]);
      setGoals([]);
      toast.success('Dados limpos com segurança.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast.error('Erro ao limpar dados');
    }
  };

  const cleanupOldData = () => {
    try {
      const { metricsRemoved, goalsRemoved } = DataRetentionManager.cleanupOldData();
      if (metricsRemoved > 0 || goalsRemoved > 0) {
        // Reload data after cleanup
        const updatedMetrics = SecureStorage.getItem('healthMetrics') || [];
        const updatedGoals = SecureStorage.getItem('healthGoals') || [];
        
        setMetrics(updatedMetrics.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        })));
        
        setGoals(updatedGoals.map((g: any) => ({
          ...g,
          targetDate: new Date(g.targetDate),
          weeklyGoals: g.weeklyGoals?.map((w: any) => ({
            ...w,
            weekStart: new Date(w.weekStart),
            weekEnd: new Date(w.weekEnd)
          })) || [],
          monthlyGoals: g.monthlyGoals || []
        })));
        
        toast.success(`Dados antigos removidos: ${metricsRemoved} medições, ${goalsRemoved} metas`);
      } else {
        toast.info('Nenhum dado antigo encontrado para remoção');
      }
    } catch (error) {
      console.error('Failed to cleanup data:', error);
      toast.error('Erro ao limpar dados antigos');
    }
  };

  const onUpdateGoal = (updated: Goal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
  };

  const getCurrentValues = (metricsData = metrics): Record<MetricType, number | undefined> => {
    const latestMetric = metricsData[0]; // Already sorted by date descending
    
    return {
      weight: latestMetric?.weight,
      muscleMass: latestMetric?.muscleMass,
      fatMass: latestMetric?.fatMass,
      bmi: latestMetric?.bmi,
      fatPercentage: latestMetric?.fatPercentage
    };
  };

  const getMetricGoal = (type: MetricType): Goal | undefined => {
    return goals.find(goal => goal.type === type);
  };

  const getPreviousMetric = (index: number = 1): HealthMetric | undefined => {
    return metrics[index];
  };

  const currentValues = getCurrentValues();
  const lastMetric = metrics[0];
  const previousMetric = getPreviousMetric();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${crossfitBg})`,
          filter: 'blur(1px)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/95 to-background/90" />
      
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 py-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div 
                className="w-12 h-12 bg-cover bg-center rounded-full border-2 border-primary glow"
                style={{ backgroundImage: `url(${deadliftSilhouette})` }}
              />
              <h1 className="text-4xl md:text-5xl font-oswald font-bold bg-gradient-hero bg-clip-text text-transparent">
                EVOLUTION TRACKER
              </h1>
              <div 
                className="w-12 h-12 bg-cover bg-center rounded-full border-2 border-primary glow"
                style={{ backgroundImage: `url(${deadliftSilhouette})` }}
              />
            </div>
            <p className="text-gold-light text-base md:text-lg font-rajdhani font-medium">
              TRANSFORME SEU CORPO • SUPERE SEUS LIMITES • ALCANCE SUAS METAS
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
            <Button variant="secondary" onClick={handleExport} className="shadow-glow">
              Exportar dados (JSON)
            </Button>
            <Button variant="outline" onClick={onImportClick} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Importar dados
            </Button>
            <Button variant="outline" onClick={cleanupOldData} className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar dados antigos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onFileChange}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shadow-glow">Limpar todos os dados</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-primary font-oswald">Tem certeza que deseja limpar?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Essa ação removerá todas as medições e metas salvas neste dispositivo. Não poderá ser desfeita.
                    Os dados são armazenados com criptografia para sua segurança.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearData} className="bg-destructive hover:bg-destructive/90">Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>


          {/* Metrics Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {(Object.keys(metricLabels) as MetricType[]).map((type) => (
              <MetricCard
                key={type}
                title={metricLabels[type].label}
                value={currentValues[type]}
                unit={metricLabels[type].unit}
                goal={getMetricGoal(type)}
                lastMetric={lastMetric}
                previousMetric={previousMetric}
                icon={metricIcons[type]}
                color={metricColors[type]}
                metricType={type}
              />
            ))}
          </div>

          {/* Action Cards - Below Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddMetricForm onAddMetric={addMetric} />
            <GoalForm onAddGoal={addGoal} currentValues={currentValues} />
          </div>


          {/* Charts Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-oswald font-bold text-primary mb-2 flex items-center justify-center gap-2">
                <BarChart3 className="h-8 w-8" />
                ANÁLISE DE PROGRESSO
              </h2>
              <p className="text-muted-foreground font-rajdhani">
                Acompanhe sua evolução e o progresso das suas metas
              </p>
            </div>


            {/* Individual Metric Charts */}
            {metrics.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(metricLabels) as MetricType[]).map((type) => (
                  <MetricChart
                    key={type}
                    metrics={metrics}
                    goals={goals}
                    type={type}
                    title={metricLabels[type].label}
                    unit={metricLabels[type].unit}
                    color={metricColors[type]}
                    goal={getMetricGoal(type)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Goals Panel */}
          {goals.length > 0 && (
            <GoalsPanel goals={goals} onUpdateGoal={onUpdateGoal} />
          )}


          {/* Recent Metrics Table (if there are metrics) */}
          {metrics.length > 0 && (
            <div className="bg-gradient-dark rounded-lg shadow-intense border border-border/50 p-6">
              <h2 className="text-xl font-oswald font-semibold mb-4 text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                HISTÓRICO RECENTE
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">Data</th>
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">Peso</th>
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">Massa Muscular</th>
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">Massa de Gordura</th>
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">IMC</th>
                      <th className="text-left p-3 text-gold font-rajdhani font-semibold">% Gordura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slice(0, 5).map((metric) => (
                      <tr key={metric.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-rajdhani font-medium">{metric.date.toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 font-rajdhani">{metric.weight ? `${metric.weight.toFixed(1)} kg` : '-'}</td>
                        <td className="p-3 font-rajdhani">{metric.muscleMass ? `${metric.muscleMass.toFixed(1)} kg` : '-'}</td>
                        <td className="p-3 font-rajdhani">{metric.fatMass ? `${metric.fatMass.toFixed(1)} kg` : '-'}</td>
                        <td className="p-3 font-rajdhani">{metric.bmi ? metric.bmi.toFixed(1) : '-'}</td>
                        <td className="p-3 font-rajdhani">{metric.fatPercentage ? `${metric.fatPercentage.toFixed(1)}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}