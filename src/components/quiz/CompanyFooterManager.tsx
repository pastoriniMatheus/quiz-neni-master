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
  footerSettings?: any; // Adicionado
}

export const CompanyFooterManager: React.FC<CompanyFooterManagerProps> = ({
  companyData,
  showLocation = true,
  showCounter = true,
  enableLocationScript = true,
  footerSettings, // Recebendo footerSettings
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
      {/* O LocationScript não é mais renderizado aqui, a lógica está no QuizFooter */}
      
      {/* Footer do quiz */}
      <QuizFooter
        companyData={finalCompanyData}
        showLocation={showLocation}
        showCounter={showCounter}
        footerSettings={footerSettings} // Passando footerSettings
      />
    </>
  );
};