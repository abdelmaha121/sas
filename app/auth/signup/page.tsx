'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, register, loading: authLoading } = useAuth();
  const { language } = useLanguage();

  const accountType = 'customer';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.firstName) {
      setError(language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: accountType,
      });

      // Success - redirect will happen via useEffect
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل إنشاء الحساب' : 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 ml-2" />
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {language === 'ar' ? 'إنشاء حساب عميل' : 'Create Customer Account'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'انضم إلينا كعميل واستمتع بخدماتنا'
              : 'Join us as a customer and enjoy our services'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}



        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              {language === 'ar'
                ? 'التسجيل متاح للعملاء فقط. مقدمو الخدمات يتم إضافتهم من قبل المسؤول'
                : 'Registration is available for customers only. Service providers are added by administrators'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                {language === 'ar' ? 'الاسم الأول' : 'First Name'} *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder={language === 'ar' ? 'أحمد' : 'John'}
                required
                disabled={loading}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="lastName">
                {language === 'ar' ? 'اسم العائلة' : 'Last Name'}
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder={language === 'ar' ? 'محمد' : 'Doe'}
                disabled={loading}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone">
              {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={language === 'ar' ? '05xxxxxxxx' : '05xxxxxxxx'}
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password">
              {language === 'ar' ? 'كلمة المرور' : 'Password'} *
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'At least 6 characters'}
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...'}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link
              href={`/auth/login${redirectUrl !== '/' ? `?redirect=${redirectUrl}` : ''}`}
              className="text-primary font-semibold hover:underline"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-xs text-center text-muted-foreground">
            {language === 'ar'
              ? 'بإنشاء حساب، أنت توافق على'
              : 'By creating an account, you agree to our'}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Link>
          </p>
        </div>
        </Card>
      </div>
    </div>
  );
}
