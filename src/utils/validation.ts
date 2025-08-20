import { z } from 'zod';

// Health metric validation ranges based on realistic human values
export const healthMetricSchema = z.object({
  date: z.date(),
  weight: z.number()
    .min(20, 'Peso deve ser maior que 20kg')
    .max(300, 'Peso deve ser menor que 300kg')
    .optional(),
  muscleMass: z.number()
    .min(5, 'Massa muscular deve ser maior que 5kg')
    .max(150, 'Massa muscular deve ser menor que 150kg')
    .optional(),
  fatMass: z.number()
    .min(1, 'Massa de gordura deve ser maior que 1kg')
    .max(200, 'Massa de gordura deve ser menor que 200kg')
    .optional(),
  bmi: z.number()
    .min(10, 'IMC deve ser maior que 10')
    .max(60, 'IMC deve ser menor que 60')
    .optional(),
  fatPercentage: z.number()
    .min(2, '% de gordura deve ser maior que 2%')
    .max(70, '% de gordura deve ser menor que 70%')
    .optional()
}).refine(
  (data) => {
    // At least one metric must be provided
    return data.weight !== undefined || 
           data.muscleMass !== undefined || 
           data.fatMass !== undefined || 
           data.bmi !== undefined || 
           data.fatPercentage !== undefined;
  },
  {
    message: 'Pelo menos uma métrica deve ser fornecida',
    path: ['weight'] // Show error on weight field
  }
);

export const goalSchema = z.object({
  type: z.enum(['weight', 'muscleMass', 'fatMass', 'bmi', 'fatPercentage']),
  targetValue: z.number()
    .min(0.1, 'Valor da meta deve ser maior que 0.1')
    .max(500, 'Valor da meta deve ser menor que 500'),
  targetDate: z.date()
    .min(new Date(), 'Data da meta deve ser no futuro'),
  currentValue: z.number().optional()
}).refine(
  (data) => {
    // Validate ranges based on metric type
    const ranges = {
      weight: { min: 20, max: 300 },
      muscleMass: { min: 5, max: 150 },
      fatMass: { min: 1, max: 200 },
      bmi: { min: 10, max: 60 },
      fatPercentage: { min: 2, max: 70 }
    };
    
    const range = ranges[data.type];
    return data.targetValue >= range.min && data.targetValue <= range.max;
  },
  (data) => ({
    message: `Valor inválido para ${data.type}. Verifique os limites aceitáveis.`,
    path: ['targetValue']
  })
);

// Input sanitization helpers
export const sanitizeNumericInput = (value: string): string => {
  // Remove any non-numeric characters except dots and commas
  const cleaned = value.replace(/[^0-9.,]/g, '');
  // Replace comma with dot for consistency
  return cleaned.replace(',', '.');
};

export const validateDateRange = (date: Date): boolean => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  return date >= oneYearAgo && date <= oneYearFromNow;
};

// Form validation error formatting
export const formatValidationError = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};