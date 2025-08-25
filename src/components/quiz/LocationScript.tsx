import React, { useEffect, useState } from 'react';

interface LocationScriptProps {
  customScript?: string;
}

export const LocationScript: React.FC<LocationScriptProps> = ({ customScript }) => {
  const [location, setLocation] = useState('Detectando localização...');
  const [peopleCount, setPeopleCount] = useState(Math.floor(Math.random() * (800 - 400 + 1)) + 400);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let scriptElement: HTMLScriptElement | null = null; // Para rastrear o script adicionado

    if (customScript) {
      try {
        // Tenta criar um elemento script e definir seu texto
        scriptElement = document.createElement('script');
        scriptElement.textContent = customScript;
        document.head.appendChild(scriptElement);
        
        return () => {
          // Limpa o script quando o componente é desmontado
          if (scriptElement && document.head.contains(scriptElement)) {
            document.head.removeChild(scriptElement);
          }
        };
      } catch (error) {
        console.error('Erro ao executar script personalizado:', error);
      }
    } else {
      // Lógica existente para obter localização e atualizar contador
      const mostrarCidade = async () => {
        try {
          const response = await fetch("https://api-bdc.io/data/reverse-geocode-client");
          
          const contentType = response.headers.get("content-type");
          if (!response.ok || !contentType || !contentType.includes("application/json")) {
            console.error("Erro ao obter a cidade: Resposta da API não foi OK ou não é JSON", response.status, contentType);
            setLocation('Brasil');
            return;
          }

          const data = await response.json();
          
          const cidade = data.city || 'Cidade';
          const estado = data.principalSubdivision || 'Estado';
          
          setLocation(`${cidade}, ${estado}`);
        } catch (error) {
          console.error("Erro ao obter a cidade:", error);
          setLocation('Brasil');
        }
      };

      const gerarNumeroAleatorio = () => {
        return Math.floor(Math.random() * (800 - 400 + 1)) + 400;
      };

      const atualizarNumero = () => {
        const novoNumero = gerarNumeroAleatorio();
        const steps = 100; 
        
        const updateInterval = setInterval(() => {
          setPeopleCount(prevCount => {
            const step = (novoNumero - prevCount) / steps; 
            const newCount = prevCount + step;

            if (Math.abs(newCount - novoNumero) < Math.abs(step)) {
              clearInterval(updateInterval);
              return novoNumero;
            }
            return Math.round(newCount);
          });
        }, 100); 
      };

      const tempoAleatorio = () => {
        return Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000; 
      };

      const iniciarAtualizacoes = () => {
        atualizarNumero();
        intervalId = setTimeout(iniciarAtualizacoes, tempoAleatorio());
      };

      mostrarCidade();
      
      setTimeout(iniciarAtualizacoes, 1000);

      return () => {
        if (intervalId) {
          clearTimeout(intervalId);
        }
      };
    }
  }, [customScript]); 

  return (
    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>📍</span>
        <span>{location}</span>
      </div>
      <div className="flex items-center flex-wrap justify-center gap-x-1">
        <span className="flex items-center gap-1">
          <span>👥</span>
          <span className="font-bold text-green-600">{peopleCount}</span>
        </span>
        <span className="text-center">pessoas em {location.split(',')[0]} respondendo neste momento</span>
      </div>
    </div>
  );
};