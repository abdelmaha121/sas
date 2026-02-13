'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface RequireAuthProps {
  children: ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export default function RequireAuth({ children, roles, redirectTo }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const currentPath = encodeURIComponent(redirectTo || pathname || '/');
        router.push(`/auth/login?redirect=${currentPath}`);
      } else if (roles && roles.length > 0 && !roles.includes(user.role)) {
        router.push('/');
      }
    }
  }, [user, loading, router, pathname, roles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || (roles && roles.length > 0 && !roles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
