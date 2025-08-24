
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface AdManagerProps {
  isTestMode: boolean;
  adCode?: string;
  adMessage: string;
  onAdComplete: () => void;
}

export const AdManager: React.FC<AdManagerProps> = ({
  isTestMode,
  adCode,
  adMessage,
  onAdComplete
}) => {
  const [countdown, setCountdown] = useState(5);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTestMode) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowSkipButton(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isTestMode]);

  useEffect(() => {
    // Execute ad scripts when component mounts and we have real ad code
    if (!isTestMode && adCode && adContainerRef.current) {
      const container = adContainerRef.current;
      container.innerHTML = adCode;

      // Execute any scripts in the ad code inside the container (not in <head>)
      const scripts = Array.from(container.querySelectorAll('script'));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');

        // copy all attributes
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
        } else {
          newScript.text = oldScript.text || '';
        }

        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      // Show skip button after 5 seconds for real ads
      const timer = setTimeout(() => {
        setShowSkipButton(true);
      }, 5000);

      return () => {
        clearTimeout(timer);
        if (adContainerRef.current) {
          adContainerRef.current.innerHTML = '';
        }
      };
    }
  }, [isTestMode, adCode]);

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
