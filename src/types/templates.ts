
export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  design: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonStyle: 'rounded' | 'square' | 'pill';
    cardStyle: 'modern' | 'minimal' | 'gradient';
    animation: 'fade' | 'slide' | 'scale';
  };
  preview: string;
}

export const QUIZ_TEMPLATES: QuizTemplate[] = [
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Template inspirado em serviços financeiros',
    design: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      buttonStyle: 'rounded',
      cardStyle: 'modern',
      animation: 'fade',
    },
    preview: 'Azul profissional, ideal para quizzes financeiros'
  },
  {
    id: 'automotive',
    name: 'Automotivo',
    description: 'Template inspirado em serviços automotivos',
    design: {
      primaryColor: '#dc2626',
      secondaryColor: '#991b1b',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonStyle: 'square',
      cardStyle: 'gradient',
      animation: 'slide',
    },
    preview: 'Vermelho dinâmico, perfeito para setor automotivo'
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Template com design moderno e minimalista',
    design: {
      primaryColor: '#7c3aed',
      secondaryColor: '#5b21b6',
      backgroundColor: '#fafafa',
      textColor: '#374151',
      buttonStyle: 'pill',
      cardStyle: 'minimal',
      animation: 'scale',
    },
    preview: 'Roxo elegante, design contemporâneo'
  },
  {
    id: 'green',
    name: 'Natural',
    description: 'Template com cores naturais',
    design: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
      backgroundColor: '#f0fdf4',
      textColor: '#1f2937',
      buttonStyle: 'rounded',
      cardStyle: 'modern',
      animation: 'fade',
    },
    preview: 'Verde natural, transmite confiança'
  }
];
