
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Settings, 
  Shield,
  Menu,
  X,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Respostas', href: '/respostas', icon: Database },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  const downloadPlugin = async () => {
    try {
      // Usar o conteúdo do plugin real do arquivo existente
      const pluginResponse = await fetch('/src/wordpress-plugin/quiz-nenimaster-plugin.php');
      const pluginContent = await pluginResponse.text();
      
      const readmeResponse = await fetch('/src/wordpress-plugin/readme.txt');
      const readmeContent = await readmeResponse.text();
      
      // Importar JSZip dinamicamente
      const JSZip = (await import('jszip')).default;
      
      const zip = new JSZip();
      
      // Adicionar arquivos ao ZIP
      zip.file('quiz-nenimaster/quiz-nenimaster-plugin.php', pluginContent);
      zip.file('quiz-nenimaster/readme.txt', readmeContent);
      
      // Gerar o arquivo ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Criar link para download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiz-nenimaster-wordpress-plugin.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Plugin WordPress baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar plugin:', error);
      toast.error('Erro ao baixar o plugin. Tente novamente.');
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quiz NeniMaster
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Plugin Download Button */}
          <div className="mt-6 border-t pt-4">
            <Button
              onClick={downloadPlugin}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Download className="mr-3 h-4 w-4 flex-shrink-0" />
              Plugin WordPress
            </Button>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="text-xs text-gray-500 text-center">
            Quiz NeniMaster v1.0
          </div>
        </div>
      </div>
    </>
  );
};
