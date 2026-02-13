'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Globe, User, LogOut, LogIn, UserPlus, Menu, X, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useBasket } from '@/lib/contexts/BasketContext';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { totalItems } = useBasket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { href: '/services', label: language === 'ar' ? 'الخدمات' : 'Services' },
    { href: '/how-it-works', label: language === 'ar' ? 'كيف يعمل' : 'How It Works' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname?.startsWith(href);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case 'admin':
      case 'super_admin':
        return '/admin/dashboard';
      case 'provider':
      case 'provider_staff':
        return '/provider/dashboard';
      case 'customer':
      default:
        return '/customer/profile';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              خد
            </div>
            <span className="hidden sm:inline">
              {language === 'ar' ? 'خدماتي' : 'My Services'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Globe className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Auth Section */}
            {user ? (
              <>
                {/* Cart Icon - Only for customers */}
                {user.role === 'customer' && (
                  <Link href="/basket" className="relative">
                    <Button variant="ghost" size="icon" title={language === 'ar' ? 'سلة الحجز' : 'Booking Basket'}>
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>{user.firstName || user.email}</span>
                </Button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50 py-2">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <Link
                        href={getDashboardLink()}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                      </Link>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent w-full text-left text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t pt-4 px-4 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'English' : 'العربية'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex-1"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'داكن' : 'Dark'}
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'فاتح' : 'Light'}
                    </>
                  )}
                </Button>
              </div>

              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-accent rounded-lg">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Mobile Cart Button - Only for customers */}
                  {user.role === 'customer' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link href="/basket" onClick={() => setMobileMenuOpen(false)}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'سلة الحجز' : 'Booking Basket'}
                        {totalItems > 0 && (
                          <Badge variant="destructive" className="mr-2 h-5 px-1.5 text-xs">
                            {totalItems}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
