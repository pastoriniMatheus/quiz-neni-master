import React from 'react';
// Removido: import { LocationScript } from './LocationScript'; // Não é mais necessário aqui

import { useFooterSettings } from '@/hooks/useFooterSettings';

interface FooterSettings {
  showLocation?: boolean;
  showCounter?: boolean;
  locationScript?: string;
  counterScript?: string;
  companyName?: string;
  privacyUrl?: string;
  termsUrl?: string;
  footerText?: string;
}

interface QuizFooterProps {
  footerSettings?: FooterSettings;
  companyData?: {
    name: string;
    privacyUrl?: string;
    termsUrl?: string;
  };
  showLocation?: boolean;
  showCounter?: boolean;
}

export const QuizFooter: React.FC<QuizFooterProps> = ({ 
  footerSettings, 
  companyData,
  showLocation: propShowLocation,
  showCounter: propShowCounter 
}) => {
  const { footerSettings: dbFooterSettings } = useFooterSettings();

  // Use database settings if available, then props, then defaults
  const settings = {
    showLocation: propShowLocation ?? dbFooterSettings?.showLocation ?? footerSettings?.showLocation ?? true,
    showCounter: propShowCounter ?? dbFooterSettings?.showCounter ?? footerSettings?.showCounter ?? true,
    locationScript: dbFooterSettings?.locationScript ?? footerSettings?.locationScript ?? '',
    counterScript: dbFooterSettings?.counterScript ?? footerSettings?.counterScript ?? '',
    companyName: dbFooterSettings?.companyName ?? companyData?.name ?? footerSettings?.companyName ?? 'Quiz NeniMaster',
    privacyUrl: dbFooterSettings?.privacyUrl ?? companyData?.privacyUrl ?? footerSettings?.privacyUrl ?? '',
    termsUrl: dbFooterSettings?.termsUrl ?? companyData?.termsUrl ?? footerSettings?.termsUrl ?? '',
    footerText: dbFooterSettings?.footerText ?? footerSettings?.footerText ?? `© ${new Date().getFullYear()} {companyName}`
  };

  // Processar o texto do footer substituindo variáveis
  const processedFooterText = settings.footerText
    .replace('{companyName}', settings.companyName)
    .replace('{year}', new Date().getFullYear().toString());

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* A lógica de LocationScript e CounterScript será injetada pelo plugin WordPress */}
          {/* Este componente React não precisa mais renderizá-los diretamente */}
          {/* Apenas o texto do footer e links */}
          
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">
              Ao prosseguir você concorda com os nossos<br/>
              <a href={settings.termsUrl || '#'} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                Termos de Uso
              </a>
              {' e '}
              <a href={settings.privacyUrl || '#'} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                Políticas de Privacidade
              </a>
            </p>
            <p>
              {processedFooterText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};