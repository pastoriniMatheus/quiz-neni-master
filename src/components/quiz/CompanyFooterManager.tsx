import React from 'react';
import { QuizFooter } from './QuizFooter';
// Removido: import { LocationScript } from './LocationScript'; // Não é mais necessário aqui

interface CompanyData {
  name: string;
  privacyUrl?: string;
  termsUrl?: string;
}

interface CompanyFooterManagerProps {
  companyData?: CompanyData;
  showLocation?: boolean;
  showCounter?: boolean;
  enableLocationScript?: boolean;
}

export const CompanyFooterManager: React.FC<CompanyFooterManagerProps> = ({
  companyData,
  showLocation = true,
  showCounter = true,
  enableLocationScript = true,
}) => {
  // Dados padrão da empresa se não fornecidos
  const defaultCompanyData: CompanyData = {
    name: 'Quiz Builder',
    privacyUrl: '#',
    termsUrl: '#',
  };

  const finalCompanyData = companyData || defaultCompanyData;

  return (
    <>
      {/* Script de localização - invisível, apenas detecta. A lógica agora é tratada pelo plugin WP. */}
      {/* {enableLocationScript && <LocationScript />} */}
      
      {/* Footer do quiz */}
      <QuizFooter
        companyData={finalCompanyData}
        showLocation={showLocation}
        showCounter={showCounter}
      />
    </>
  );
};