import React, { useEffect, useRef, useState } from 'react';
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

  const locationDisplayRef = useRef<HTMLSpanElement>(null);
  const locationCityDisplayRef = useRef<HTMLSpanElement>(null);
  const peopleCountRef = useRef<HTMLSpanElement>(null);
  const counterIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Limpa intervalos e scripts anteriores ao montar ou re-renderizar
    if (counterIntervalRef.current) {
      clearInterval(counterIntervalRef.current);
    }
    // Remove scripts injetados anteriormente para evitar duplicação
    document.querySelectorAll('.qnm-injected-script').forEach(el => el.remove());

    const injectScript = (scriptContent: string, className: string) => {
      if (!scriptContent) return;
      try {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = scriptContent;
        Array.from(tempContainer.children).forEach(child => {
          let elementToAppend;
          if (child.tagName === 'SCRIPT') {
            const newScript = document.createElement('script');
            Array.from(child.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = child.textContent;
            elementToAppend = newScript;
          } else {
            elementToAppend = child.cloneNode(true);
          }
          (elementToAppend as HTMLElement).classList.add('qnm-injected-script', className);
          document.head.appendChild(elementToAppend);
        });
      } catch (error) {
        console.error('Erro ao analisar ou executar script personalizado:', error);
      }
    };

    // Lógica de localização
    if (settings.showLocation) {
      if (settings.locationScript) {
        injectScript(settings.locationScript, 'qnm-location-script');
      } else {
        const mostrarCidade = async () => {
          if (!locationDisplayRef.current || !locationCityDisplayRef.current) return;
          try {
            const response = await fetch("https://api-bdc.io/data/reverse-geocode-client");
            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType || !contentType.includes("application/json")) {
              console.error("Erro ao obter a cidade: Resposta da API não foi OK ou não é JSON", response.status, contentType);
              locationDisplayRef.current.textContent = 'Brasil';
              locationCityDisplayRef.current.textContent = 'Brasil';
              return;
            }
            const data = await response.json();
            const cidade = data.city || 'Cidade';
            const estado = data.principalSubdivision || 'Estado';
            locationDisplayRef.current.textContent = `${cidade}, ${estado}`;
            locationCityDisplayRef.current.textContent = cidade;
          } catch (error) {
            console.error("Erro ao obter a cidade:", error);
            locationDisplayRef.current.textContent = 'Brasil';
            locationCityDisplayRef.current.textContent = 'Brasil';
          }
        };
        mostrarCidade();
      }
    }

    // Lógica do contador
    if (settings.showCounter) {
      if (settings.counterScript) {
        injectScript(settings.counterScript, 'qnm-counter-script');
      } else {
        let peopleCount = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
        if (peopleCountRef.current) {
          peopleCountRef.current.textContent = peopleCount.toString();
        }

        const gerarNumeroAleatorio = () => {
          return Math.floor(Math.random() * (800 - 400 + 1)) + 400;
        };

        const atualizarNumero = () => {
          const novoNumero = gerarNumeroAleatorio();
          const steps = 100; 
          let currentStep = 0;
          const startCount = peopleCount;
          const diff = novoNumero - startCount;

          if (counterIntervalRef.current) clearInterval(counterIntervalRef.current);

          counterIntervalRef.current = window.setInterval(() => {
            currentStep++;
            const newCount = Math.round(startCount + (diff / steps) * currentStep);
            if (peopleCountRef.current) {
              peopleCountRef.current.textContent = newCount.toString();
            }

            if (currentStep >= steps) {
              clearInterval(counterIntervalRef.current!);
              peopleCount = novoNumero;
              if (peopleCountRef.current) {
                peopleCountRef.current.textContent = peopleCount.toString();
              }
              setTimeout(atualizarNumero, Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
            }
          }, 100);
        };
        setTimeout(atualizarNumero, 1000); // Initial delay
      }
    }

    return () => {
      if (counterIntervalRef.current) {
        clearInterval(counterIntervalRef.current);
      }
      document.querySelectorAll('.qnm-injected-script').forEach(el => el.remove());
    };
  }, [settings.showLocation, settings.showCounter, settings.locationScript, settings.counterScript]);


  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {(settings.showLocation || settings.showCounter) && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {settings.showLocation && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span id="qnm-location-display" ref={locationDisplayRef}>Detectando localização...</span>
                </div>
              )}
              {settings.showCounter && (
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span id="qnm-people-count" ref={peopleCountRef} className="text-green-600">0</span>
                  <span>pessoas em <span id="qnm-location-city-display" ref={locationCityDisplayRef}></span> respondendo neste momento</span>
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