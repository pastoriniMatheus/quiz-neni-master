import React, { useEffect, useRef } from 'react';
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
  footerSettings: propFooterSettings, // Renomeado para evitar conflito
  companyData,
  showLocation: propShowLocation,
  showCounter: propShowCounter 
}) => {
  const { footerSettings: dbFooterSettings } = useFooterSettings();

  // Use database settings if available, then props, then defaults
  const settings = {
    showLocation: propShowLocation ?? dbFooterSettings?.showLocation ?? propFooterSettings?.showLocation ?? true,
    showCounter: propShowCounter ?? dbFooterSettings?.showCounter ?? propFooterSettings?.showCounter ?? true,
    locationScript: dbFooterSettings?.locationScript ?? propFooterSettings?.locationScript ?? '',
    counterScript: dbFooterSettings?.counterScript ?? propFooterSettings?.counterScript ?? '',
    companyName: dbFooterSettings?.companyName ?? companyData?.name ?? propFooterSettings?.companyName ?? 'Quiz NeniMaster',
    privacyUrl: dbFooterSettings?.privacyUrl ?? companyData?.privacyUrl ?? propFooterSettings?.privacyUrl ?? '',
    termsUrl: dbFooterSettings?.termsUrl ?? companyData?.termsUrl ?? propFooterSettings?.termsUrl ?? '',
    footerText: dbFooterSettings?.footerText ?? propFooterSettings?.footerText ?? `© {year} {companyName}`
  };

  // Processar o texto do footer substituindo variáveis
  const processedFooterText = settings.footerText
    .replace('{companyName}', settings.companyName)
    .replace('{year}', new Date().getFullYear().toString());

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {(settings.showLocation || settings.showCounter) && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {settings.showLocation && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span id="qnm-location-display">Detectando localização...</span>
                </div>
              )}
              {settings.showCounter && (
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span id="qnm-people-count" className="text-green-600">0</span>
                  <span>pessoas em <span id="qnm-location-city-display"></span> respondendo neste momento</span>
                </div>
              )}
            </div>
          )}
          
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