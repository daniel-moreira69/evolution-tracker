import { Goal, MonthlyGoal, MetricType } from "@/types/health";

interface MonthlyGoalParams {
  pesoAtual: number;        // kg
  pesoMeta: number;         // kg
  dataAlvo: string;         // formato: "YYYY-MM-DD"
  altura: number;           // cm
  massaMuscular: number;    // kg
  massaGordura: number;     // kg
  percentualGordura: number; // %
}

interface MetricGoals {
  mes: number;
  peso: number;
  massaMuscular: number;
  massaGordura: number;
  imc: number;
  percentualGordura: number;
}

// Função para calcular metas mensais baseada no script fornecido
export function calcularMetasMensais(params: MonthlyGoalParams): MetricGoals[] {
  const {
    pesoAtual,
    pesoMeta,
    dataAlvo,
    altura,
    massaMuscular,
    massaGordura,
    percentualGordura
  } = params;

  // Converter altura para metros
  const alturaM = altura / 100;

  // Calcular tempo em meses
  const hoje = new Date();
  const alvo = new Date(dataAlvo);
  const meses = Math.max(1, (alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth()));

  // Diferença de peso a perder
  const perdaTotal = pesoAtual - pesoMeta;
  const perdaPorMes = perdaTotal / meses;

  // Distribuir perda entre gordura e músculo
  // -> assume 85% da perda vinda de gordura, 15% de massa magra
  const perdaGorduraTotal = perdaTotal * 0.85;
  const perdaMusculoTotal = perdaTotal * 0.15;

  const perdaGorduraMes = perdaGorduraTotal / meses;
  const perdaMusculoMes = perdaMusculoTotal / meses;

  // Array para armazenar evolução
  const metas: MetricGoals[] = [];

  for (let i = 0; i <= meses; i++) {
    const peso = pesoAtual - (perdaPorMes * i);
    const gordura = massaGordura - (perdaGorduraMes * i);
    const musculo = massaMuscular - (perdaMusculoMes * i);

    const imc = peso / (alturaM * alturaM);
    const percGordura = (gordura / peso) * 100;

    metas.push({
      mes: i,
      peso: parseFloat(peso.toFixed(1)),
      massaMuscular: parseFloat(musculo.toFixed(1)),
      massaGordura: parseFloat(gordura.toFixed(1)),
      imc: parseFloat(imc.toFixed(1)),
      percentualGordura: parseFloat(percGordura.toFixed(1))
    });
  }

  return metas;
}

// Função para criar meta com breakdown mensal usando o novo sistema
export function criarMetaComBreakdownMensal(
  type: MetricType,
  targetValue: number,
  targetDate: Date,
  currentValues: {
    weight?: number;
    muscleMass?: number;
    fatMass?: number;
    fatPercentage?: number;
    height?: number; // cm
  }
): { monthlyGoals: MonthlyGoal[] } {
  const monthlyGoals: MonthlyGoal[] = [];

  // Se temos dados suficientes para o cálculo completo, usar o script avançado
  if (currentValues.weight && currentValues.muscleMass && currentValues.fatMass && 
      currentValues.fatPercentage && currentValues.height && type === 'weight') {
    
    const metasMensais = calcularMetasMensais({
      pesoAtual: currentValues.weight,
      pesoMeta: targetValue,
      dataAlvo: targetDate.toISOString().split('T')[0],
      altura: currentValues.height,
      massaMuscular: currentValues.muscleMass,
      massaGordura: currentValues.fatMass,
      percentualGordura: currentValues.fatPercentage
    });

    // Converter para MonthlyGoal format
    const hoje = new Date();
    metasMensais.forEach((meta, index) => {
      if (index === 0) return; // Skip month 0 (current values)
      
      const targetMonth = new Date(hoje.getFullYear(), hoje.getMonth() + index, 0); // Last day of month
      monthlyGoals.push({
        month: targetMonth.getMonth() + 1,
        year: targetMonth.getFullYear(),
        targetValue: meta.peso,
        achieved: false,
        actualValue: undefined
      });
    });
  } else {
    // Fallback para cálculo simples linear
    const hoje = new Date();
    const endDate = new Date(targetDate);
    const currentValue = currentValues[type] || 0;
    
    const totalMonths = Math.max(1, (endDate.getFullYear() - hoje.getFullYear()) * 12 + (endDate.getMonth() - hoje.getMonth()));
    const totalChange = targetValue - currentValue;
    const changePerMonth = totalChange / totalMonths;

    for (let i = 1; i <= totalMonths; i++) {
      const targetMonth = new Date(hoje.getFullYear(), hoje.getMonth() + i, 0); // Last day of month
      const monthlyTargetValue = currentValue + (changePerMonth * i);
      
      monthlyGoals.push({
        month: targetMonth.getMonth() + 1,
        year: targetMonth.getFullYear(),
        targetValue: parseFloat(monthlyTargetValue.toFixed(1)),
        achieved: false,
        actualValue: undefined
      });
    }
  }

  return { monthlyGoals };
}