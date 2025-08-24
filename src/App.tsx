
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import Index from '@/pages/Index';
import { QuizBuilder } from '@/pages/QuizBuilder';
import { SavedResponses } from '@/pages/SavedResponses';
import { Settings } from '@/pages/Settings';
import { AdminPanel } from '@/pages/AdminPanel';
import { AuthPage } from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import { ThemeProvider } from '@/components/ui/theme-provider';
import PublicQuiz from '@/pages/PublicQuiz';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="quiz-builder-theme">
        <Router>
          <AuthProvider>
            <Toaster />
            <Routes>
              {/* Public Routes */}
              <Route path="/quiz/:slug" element={<PublicQuiz />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Index />} />
                <Route path="quiz/novo" element={<QuizBuilder />} />
                <Route path="quiz/:id/editar" element={<QuizBuilder />} />
                <Route path="respostas" element={<SavedResponses />} />
                <Route path="configuracoes" element={<Settings />} />
                <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
