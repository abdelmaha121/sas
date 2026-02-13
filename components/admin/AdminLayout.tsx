'use client';

import { ReactNode } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Store,
  ShoppingBag,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  FolderTree,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const menuItems = [
    
    { icon: BarChart3, label: t('nav.dashboard'), href: '/admin/dashboard' },
    { icon: Users, label: t('nav.users'), href: '/admin/users' },
    { icon: FolderTree, label: t('nav.categories'), href: '/admin/categories' },
    { icon: ShoppingBag, label: t('nav.services'), href: '/admin/services' },
    { icon: Calendar, label: t('nav.bookings'), href: '/admin/bookings' },
    { icon: FileText, label: 'سجل التدقيق', labelEn: 'Audit Log', href: '/admin/audit' },
    { icon: DollarSign, label: 'المالية', labelEn: 'Financial', href: '/admin/financial' },
    { icon: TrendingUp, label: 'التحليلات', labelEn: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: t('nav.settings'), href: '/admin/settings' },

  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.title')}</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' })
                .then(() => window.location.href = '/auth/login');
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
