import React from 'react';

// Este componente não renderiza nada no frontend da aplicação React.
// A lógica de detecção de localização e contador agora é tratada
// diretamente pelo componente QuizFooter.tsx.
// Ele permanece aqui apenas para compatibilidade de importação, mas não tem função ativa.

interface LocationScriptProps {
  customScript?: string;
}

export const LocationScript: React.FC<LocationScriptProps> = ({ customScript }) => {
  // Não renderiza nada
  return null;
};