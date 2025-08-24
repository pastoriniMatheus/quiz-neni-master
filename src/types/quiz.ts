
export interface QuizSession {
  id: string;
  type: 'question' | 'form';
  title: string;
  description?: string;
  options?: string[];
  showAd: boolean;
  adCode?: string;
  formFields?: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    message?: boolean;
  };
  displayTime?: number;
  required?: boolean;
}

export interface QuizSettings {
  saveResponses: boolean;
  webhook: { enabled: boolean; url: string };
  redirect: { enabled: boolean; url: string; delay: number };
  showFinalAd: boolean;
  finalAdCode?: string;
  testAdEnabled: boolean;
  processingTime?: number;
  customTexts: {
    processing: string;
    result: string;
    adMessage: string;
  };
}

export interface QuizDesign {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  pageBackgroundColor?: string; // Nova propriedade para cor de fundo da página
}

export interface Quiz {
  id?: string;
  title: string;
  description: string;
  slug?: string;
  sessions: QuizSession[];
  settings: QuizSettings;
  design: QuizDesign;
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  config?: any;
}
