
import React from 'react';

interface QuizLoadingProps {
  message?: string;
}

export const QuizLoading: React.FC<QuizLoadingProps> = ({ 
  message = "Processando suas informações..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8 max-w-md">
        <div className="relative mb-8">
          {/* Círculos animados */}
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-purple-200 dark:border-purple-800"></div>
            <div className="absolute inset-2 rounded-full border-2 border-purple-500 border-t-transparent animate-spin animation-delay-150"></div>
          </div>
          
          {/* Pontos pulsantes */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse animation-delay-75"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse animation-delay-150"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {message}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Aguarde um momento enquanto preparamos seu resultado personalizado
        </p>

        {/* Barra de progresso animada */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Analisando suas respostas...
        </p>
      </div>
    </div>
  );
};
