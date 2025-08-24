import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface AdManagerProps {
  isTestMode: boolean;
  adCode?: string;
  adMessage: string;
  onAdComplete: () => void;
  adDisplayTime?: number; // Nova prop
}

export const AdManager: React.FC<AdManagerProps> = ({
  isTestMode,
  adCode,
  adMessage,
  onAdComplete,
  adDisplayTime = 5 // Padrão para 5 segundos se não for fornecido
}) => {
  const [countdown, setCountdown] = useState(adDisplayTime);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Resetar contagem regressiva e estado do botão de pular quando adDisplayTime ou adCode muda
    setCountdown(adDisplayTime);
    setShowSkipButton(false);

    let timer: NodeJS.Timeout;
    let adTimer: NodeJS.Timeout;

    if (isTestMode) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowSkipButton(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Para anúncios reais, injetar código e definir um temporizador para o botão de pular
      if (adCode && adContainerRef.current) {
        const container = adContainerRef.current;
        container.innerHTML = adCode;

        // Executar quaisquer scripts no código do anúncio dentro do contêiner
        const scripts = Array.from(container.querySelectorAll('script'));
        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.async = true;
          } else {
            newScript.text = oldScript.text || '';
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      }

      // Temporizador para mostrar o botão de pular
      adTimer = setTimeout(() => {
        setShowSkipButton(true);
      }, adDisplayTime * 1000); // Usar adDisplayTime para anúncios reais
    }

    return () => {
      clearInterval(timer);
      clearTimeout(adTimer);
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = ''; // Limpar conteúdo do anúncio injetado
      }
    };
  }, [isTestMode, adCode, adDisplayTime]); // Adicionar adDisplayTime às dependências

  const renderTestAd = () => (
    <div className="text-center space-y-6 p-8 bg-gray-100 rounded-lg">
      <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
        <div className="text-2xl">📺</div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Anúncio de Teste</h3>
        <p className="text-muted-foreground mb-4">
          Este é um anúncio simulado para demonstração
        </p>
        {countdown > 0 && (
          <p className="text-sm">
            Aguarde {countdown} segundos...
          </p>
        )}
      </div>

      {showSkipButton && (
        <Button onClick={onAdComplete} className="gap-2">
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderRealAd = () => (
    <div className="text-center space-y-6">
      {adCode ? (
        <div 
          ref={adContainerRef}
          className="min-h-[200px] flex items-center justify-center"
        />
      ) : (
        <div className="p-8 bg-gray-100 rounded-lg">
          <p className="text-muted-foreground">Nenhum código de anúncio configurado</p>
        </div>
      )}
      
      {/* Botão "Continuar" sempre visível após o delay, independentemente do adCode */}
      {showSkipButton && (
        <Button onClick={onAdComplete} className="gap-2">
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">{adMessage}</h2>
        </div>
        
        {isTestMode ? renderTestAd() : renderRealAd()}
      </CardContent>
    </Card>
  );
};