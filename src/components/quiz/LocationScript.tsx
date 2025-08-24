import React, { useEffect, useState } from 'react';

interface LocationScriptProps {
  customScript?: string;
}

export const LocationScript: React.FC<LocationScriptProps> = ({ customScript }) => {
  const [location, setLocation] = useState('Detectando localização...');
  const [peopleCount, setPeopleCount] = useState(Math.floor(Math.random() * (800 - 400 + 1)) + 400);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (customScript) {
      // Execute custom script if provided
      try {
        const script = document.createElement('script');
        script.textContent = customScript;
        document.head.appendChild(script);
        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error('Erro ao executar script personalizado:', error);
      }
    } else {
      // Use the API to get location
      const mostrarCidade = async () => {
        try {
          const response = await fetch("https://api-bdc.io/data/reverse-geocode-client");
          
          // VERIFICAÇÃO ADICIONADA: Checar se a resposta é OK antes de tentar parsear JSON
          if (!response.ok) {
            console.error("Erro ao obter a cidade: Resposta da API não foi OK", response.status);
            setLocation('Brasil');
            return;
          }

          const data = await response.json();
          
          const cidade = data.city || 'Cidade';
          const estado = data.principalSubdivision || 'Estado';
          
          // Set location only once to avoid flickering
          setLocation(`${cidade}, ${estado}`);
        } catch (error) {
          console.error("Erro ao obter a cidade:", error);
          setLocation('Brasil');
        }
      };

      // Função para gerar número aleatório entre 400 e 800
      const gerarNumeroAleatorio = () => {
        return Math.floor(Math.random() * (800 - 400 + 1)) + 400;
      };

      // Função para atualizar o número de forma mais suave e lenta
      const atualizarNumero = () => {
        const novoNumero = gerarNumeroAleatorio();
        const steps = 100; // Mantido para transição suave
        const step = (novoNumero - peopleCount) / steps; 
        let currentCount = peopleCount;

        const updateInterval = setInterval(() => {
          currentCount += step;
          setPeopleCount(Math.round(currentCount));

          if (Math.abs(currentCount - novoNumero) < Math.abs(step)) {
            setPeopleCount(novoNumero);
            clearInterval(updateInterval);
          }
        }, 100); // Mantido para 100ms entre atualizações (10 segundos de transição total)
      };

      // Função para determinar o tempo aleatório para a próxima atualização
      const tempoAleatorio = () => {
        // Aumentado para 15 a 30 segundos para permitir que a animação termine e haja uma pausa
        return Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000; 
      };

      // Função para iniciar as atualizações com intervalo variável
      const iniciarAtualizacoes = () => {
        atualizarNumero();
        intervalId = setTimeout(iniciarAtualizacoes, tempoAleatorio());
      };

      // Get location first, then start counter updates
      mostrarCidade();
      
      // Start counter updates after a small delay
      setTimeout(iniciarAtualizacoes, 1000);

      return () => {
        if (intervalId) {
          clearTimeout(intervalId);
        }
      };
    }
  }, [customScript]); // Remove peopleCount from dependencies to avoid re-runs

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