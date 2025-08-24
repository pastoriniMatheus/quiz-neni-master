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
        const step = (novoNumero - peopleCount) / 50; // Mais passos para transição suave
        let currentCount = peopleCount;

        const updateInterval = setInterval(() => {
          currentCount += step;
          setPeopleCount(Math.round(currentCount));

          if (Math.abs(currentCount - novoNumero) < Math.abs(step)) {
            setPeopleCount(novoNumero);
            clearInterval(updateInterval);
          }
        }, 80); // Mais lento: 80ms entre atualizações
      };

      // Função para determinar o tempo aleatório para a próxima atualização
      const tempoAleatorio = () => {
        // Tempo mais longo entre atualizações: 3 a 8 segundos
        return Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
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
      {/* Ajustado para melhor alinhamento e quebra de linha em telas pequenas */}
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