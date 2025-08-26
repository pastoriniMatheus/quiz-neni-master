import React, { useEffect, useRef } from 'react';

interface LocationScriptProps {
  customScript?: string;
}

export const LocationScript: React.FC<LocationScriptProps> = ({ customScript }) => {
  const locationDisplayRef = useRef<HTMLSpanElement>(null);
  const locationCityDisplayRef = useRef<HTMLSpanElement>(null);
  const counterDisplayRef = useRef<HTMLSpanElement>(null);
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
    if (customScript) {
      injectScript(customScript, 'qnm-location-script');
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

    // Lógica do contador (apenas para o preview do sistema, o plugin WP tem sua própria)
    // Esta lógica é simplificada para o preview
    let peopleCount = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
    if (counterDisplayRef.current) {
      counterDisplayRef.current.textContent = peopleCount.toString();
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
        if (counterDisplayRef.current) {
          counterDisplayRef.current.textContent = newCount.toString();
        }

        if (currentStep >= steps) {
          clearInterval(counterIntervalRef.current!);
          peopleCount = novoNumero;
          if (counterDisplayRef.current) {
            counterDisplayRef.current.textContent = peopleCount.toString();
          }
          setTimeout(atualizarNumero, Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
        }
      }, 100);
    };
    setTimeout(atualizarNumero, 1000); // Initial delay

    return () => {
      if (counterIntervalRef.current) {
        clearInterval(counterIntervalRef.current);
      }
      document.querySelectorAll('.qnm-injected-script').forEach(el => el.remove());
    };
  }, [customScript]);

  // Este componente não renderiza nada visível diretamente, mas injeta scripts e atualiza refs
  return (
    <>
      {/* Elementos para serem atualizados pelos scripts */}
      <span id="qnm-location-display" ref={locationDisplayRef} style={{ display: 'none' }}></span>
      <span id="qnm-location-city-display" ref={locationCityDisplayRef} style={{ display: 'none' }}></span>
      <span id="qnm-people-count" ref={counterDisplayRef} style={{ display: 'none' }}></span>
    </>
  );
};