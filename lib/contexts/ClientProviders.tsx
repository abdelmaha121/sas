'use client';

import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { BasketProvider } from './BasketContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BasketProvider>
            {children}
          </BasketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
