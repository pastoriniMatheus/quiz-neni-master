import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Quiz } from '@/types/quiz';
import { AdManager } from '@/components/quiz/AdManager';
import { QuizFooter } from '@/components/quiz/QuizFooter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizPreviewProps {
  quiz: Quiz;
  footerSettings?: any;
}

const QuizPreview = ({ quiz, footerSettings }: QuizPreviewProps) => {
  const [currentSession, setCurrentSession] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showFinalAd, setShowFinalAd] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const sessions = quiz.sessions.length > 0 ? quiz.sessions : [
    {
      id: 'mock_q1',
      type: 'question' as const,
      title: 'Qual é a sua idade?',
      options: ['18-25 anos', '26-35 anos', '36-50 anos', 'Mais de 50 anos'],
      showAd: false,
      required: true,
    },
    {
      id: 'mock_q2',
      type: 'question' as const,
      title: 'Qual é a sua renda mensal?',
      options: ['Até R$ 1.500', 'R$ 1.501 - R$ 3.000', 'R$ 3.001 - R$ 5.000', 'Acima de R$ 5.000'],
      showAd: false,
      required: true,
    },
    {
      id: 'mock_form',
      type: 'form' as const,
      title: 'Complete seus dados para receber as melhores ofertas',
      showAd: false,
      formFields: { name: true, email: true },
      required: true,
    }
  ];

  const handleAnswerSelect = (option: string) => {
    const currentSessionData = sessions[currentSession];
    setAnswers({ ...answers, [currentSessionData.id]: option });
    
    setTimeout(() => {
      proceedToNextStep();
    }, 300);
  };

  const proceedToNextStep = () => {
    const currentSessionData = sessions[currentSession];
    
    if (currentSessionData?.showAd) {
      setShowAd(true);
      return;
    }

    if (currentSession < sessions.length - 1) {
      setCurrentSession(currentSession + 1);
    } else {
      handleComplete();
    }
  };

  const handleNext = () => {
    const currentSessionData = sessions[currentSession];

    if (currentSessionData.required) {
      if (currentSessionData.type === 'question' && !answers[currentSessionData.id]) {
        toast.error('Por favor, selecione uma opção para continuar.');
        return;
      }
      if (currentSessionData.type === 'form') {
        const formFields = currentSessionData.formFields || {};
        let missingFields = [];
        if (formFields.name && !formData.name?.trim()) missingFields.push('Nome');
        if (formFields.email && !formData.email?.trim()) missingFields.push('E-mail');
        
        if (missingFields.length > 0) {
          toast.error(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`);
          return;
        }
      }
    }
    
    proceedToNextStep();
  };

  const handleAdComplete = () => {
    setShowAd(false);
    proceedToNextStep();
  };

  const handleComplete = async () => {
    if (!quiz.id) {
      toast.error('Por favor, salve o quiz antes de submeter respostas.');
      return;
    }
  
    setIsLoading(true);
  
    const allResponses = { ...answers, ...formData };
    const sessionId = crypto.randomUUID();
    const userAgent = navigator.userAgent;
  
    try {
      // Obter a chave anon do Supabase client
      const anonKey = supabase.supabaseKey;

      const response = await fetch(`https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/submit-quiz-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anonKey, // Adicionar a chave API aqui
        },
        body: JSON.stringify({
          quizId: quiz.id,
          sessionId,
          userAgent,
          responseData: allResponses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar resposta do quiz');
      }
  
      toast.success('Respostas salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao invocar a função:', error);
      const errorMessage = error.message || 'Erro desconhecido no servidor.';
      toast.error(`Não foi possível salvar a resposta: ${errorMessage}`, { duration: 10000 });
    }
  
    const ms = (quiz.settings.processingTime ?? 3) * 1000;
    setTimeout(() => {
      setIsLoading(false);
      setIsCompleted(true);
  
      if (quiz.settings.showFinalAd) {
        setShowFinalAd(true);
      } else {
        setShowResult(true);
        startRedirectCountdown();
      }
    }, ms);
  };

  const handleFinalAdComplete = () => {
    setShowFinalAd(false);
    setShowResult(true);
    startRedirectCountdown();
  };

  const startRedirectCountdown = () => {
    if (quiz.settings.redirect.enabled && quiz.settings.redirect.url) {
      const delay = quiz.settings.redirect.delay || 3;
      setRedirectCountdown(delay);
      
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.open(quiz.settings.redirect.url, '_blank');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const renderProgressBar = () => (
    <div className="w-full bg-muted rounded-full h-2 mb-4">
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((currentSession + 1) / sessions.length) * 100}%`, backgroundColor: quiz.design.primaryColor }}
      />
    </div>
  );

  const renderQuestion = (session: any) => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-2">{session.title}</h2>
        <p className="text-muted-foreground text-sm">
          Pergunta {currentSession + 1} de {sessions.length}
        </p>
      </div>

      <div className="grid gap-3 max-w-sm mx-auto">
        {session.options?.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            className="p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] text-sm"
            style={{ 
              borderColor: answers[session.id] === option ? quiz.design.primaryColor : '#e5e7eb',
              backgroundColor: answers[session.id] === option ? `${quiz.design.primaryColor}10` : quiz.design.backgroundColor,
              color: quiz.design.textColor
            }}
            onMouseEnter={(e) => {
              if (answers[session.id] !== option) {
                e.currentTarget.style.borderColor = quiz.design.primaryColor;
                e.currentTarget.style.backgroundColor = `${quiz.design.primaryColor}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (answers[session.id] !== option) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = quiz.design.backgroundColor;
              }
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const renderForm = (session: any) => (
    <div className="text-center space-y-4 max-w-sm mx-auto">
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-2">{session.title}</h2>
        <p className="text-muted-foreground text-sm">
          Última etapa - Complete seus dados
        </p>
      </div>

      <div className="space-y-3 text-left">
        {session.formFields?.name && (
          <div>
            <Label htmlFor="name" className="text-sm">Nome Completo {session.required ? '*' : ''}</Label>
            <Input 
              id="name" 
              placeholder="Seu nome completo"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-sm"
            />
          </div>
        )}
        
        {session.formFields?.email && (
          <div>
            <Label htmlFor="email" className="text-sm">E-mail {session.required ? '*' : ''}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-sm"
            />
          </div>
        )}
        
        {session.formFields?.phone && (
          <div>
            <Label htmlFor="phone" className="text-sm">Telefone/WhatsApp</Label>
            <Input 
              id="phone" 
              placeholder="(11) 99999-9999"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="text-sm"
            />
          </div>
        )}
        
        {session.formFields?.message && (
          <div>
            <Label htmlFor="message" className="text-sm">Mensagem</Label>
            <Input 
              id="message" 
              placeholder="Sua mensagem"
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="text-sm"
            />
          </div>
        )}
      </div>

      <Button 
        onClick={handleNext}
        className="w-full gap-2 text-sm"
        style={{ backgroundColor: quiz.design.primaryColor }}
      >
        Buscar Melhores Ofertas
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderLoading = () => (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
        <div 
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: quiz.design.primaryColor, borderTopColor: 'transparent' }}
        ></div>
      </div>
      
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          {quiz.settings.customTexts.processing}
        </h2>
        <p className="text-muted-foreground text-sm">
          Aguarde enquanto analisamos suas respostas
        </p>
      </div>

      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: quiz.design.primaryColor }}></div>
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: quiz.design.primaryColor, animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: quiz.design.primaryColor, animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          {quiz.settings.customTexts.result}
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Com base no seu perfil, selecionamos as melhores opções
        </p>
      </div>

      {quiz.settings.redirect.enabled && quiz.settings.redirect.url ? (
        <div className="space-y-3">
          <Button 
            onClick={() => window.open(quiz.settings.redirect.url, '_blank')}
            className="min-w-[180px] text-sm"
            style={{ backgroundColor: quiz.design.primaryColor }}
          >
            Ver Recomendações
          </Button>
          
          {redirectCountdown > 0 && (
            <p className="text-xs text-muted-foreground">
              Redirecionando automaticamente em {redirectCountdown} segundos...
            </p>
          )}
        </div>
      ) : (
        <Button 
          onClick={() => window.location.reload()} 
          className="text-sm"
          style={{ backgroundColor: quiz.design.primaryColor }}
        >
          Refazer Quiz
        </Button>
      )}
    </div>
  );

  const getCurrentContent = () => {
    if (showAd) {
      const currentSessionData = sessions[currentSession];
      return (
        <AdManager
          isTestMode={quiz.settings.testAdEnabled}
          adCode={currentSessionData?.adCode}
          adMessage={quiz.settings.customTexts.adMessage}
          onAdComplete={handleAdComplete}
        />
      );
    }

    if (showFinalAd) {
      return (
        <AdManager
          isTestMode={quiz.settings.testAdEnabled}
          adCode={quiz.settings.finalAdCode}
          adMessage={quiz.settings.customTexts.adMessage}
          onAdComplete={handleFinalAdComplete}
        />
      );
    }

    if (isLoading) return renderLoading();
    if (showResult) return renderResult();
    
    const session = sessions[currentSession];
    if (session.type === 'question') {
      return renderQuestion(session);
    } else {
      return renderForm(session);
    }
  };

  const customStyles = {
    '--primary-color': quiz.design.primaryColor || '#3b82f6',
    '--secondary-color': quiz.design.secondaryColor || '#1e293b',
    '--background-color': quiz.design.backgroundColor || '#ffffff',
    '--text-color': quiz.design.textColor || '#1f2937'
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen flex flex-col" 
      style={{ backgroundColor: quiz.design.pageBackgroundColor || quiz.design.backgroundColor }}
    >
      <div className="flex-1 pb-0">
        <div className="container mx-auto px-4 py-4" style={customStyles}>
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-4">
              <div className="text-foreground mb-3" style={{ color: quiz.design.textColor }}>
                <h1 className="text-xl md:text-2xl font-bold mb-1">{quiz.title || 'Quiz Preview'}</h1>
                <p className="text-sm opacity-90">{quiz.description || 'Visualização do quiz'}</p>
              </div>

              {!showResult && !isLoading && !showAd && !showFinalAd && renderProgressBar()}
            </div>

            <Card className="bg-background border-0 shadow-lg mb-4" style={{ backgroundColor: quiz.design.backgroundColor }}>
              <CardContent className="p-4 md:p-6" style={{ color: quiz.design.textColor }}>
                {getCurrentContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QuizFooter footerSettings={footerSettings} />
    </div>
  );
};

export default QuizPreview;