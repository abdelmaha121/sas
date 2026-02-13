'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Users,
  Clock,
  DollarSign,
  Headphones,
  TrendingUp,
  Briefcase,
  FileCheck,
  Award,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function BecomeProviderPage() {
  const { t, language } = useLanguage();

  const benefits = [
    {
      icon: Users,
      title: t('becomeProvider.benefits.customers.title'),
      description: t('becomeProvider.benefits.customers.desc'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Clock,
      title: t('becomeProvider.benefits.flexible.title'),
      description: t('becomeProvider.benefits.flexible.desc'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: DollarSign,
      title: t('becomeProvider.benefits.payments.title'),
      description: t('becomeProvider.benefits.payments.desc'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Headphones,
      title: t('becomeProvider.benefits.support.title'),
      description: t('becomeProvider.benefits.support.desc'),
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: TrendingUp,
      title: t('becomeProvider.benefits.marketing.title'),
      description: t('becomeProvider.benefits.marketing.desc'),
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Briefcase,
      title: t('becomeProvider.benefits.tools.title'),
      description: t('becomeProvider.benefits.tools.desc'),
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const documents = [
    t('becomeProvider.requirements.docs.item1'),
    t('becomeProvider.requirements.docs.item2'),
    t('becomeProvider.requirements.docs.item3'),
    t('becomeProvider.requirements.docs.item4'),
  ];

  const skills = [
    t('becomeProvider.requirements.skills.item1'),
    t('becomeProvider.requirements.skills.item2'),
    t('becomeProvider.requirements.skills.item3'),
    t('becomeProvider.requirements.skills.item4'),
  ];

  const steps = [
    t('becomeProvider.steps.step1'),
    t('becomeProvider.steps.step2'),
    t('becomeProvider.steps.step3'),
    t('becomeProvider.steps.step4'),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="relative bg-gradient-to-br from-primary via-primary to-secondary py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto text-center relative z-10">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 px-6 py-2 text-lg backdrop-blur-sm">
              <Award className="w-5 h-5 ml-2" />
              {language === 'ar' ? 'فرصة مميزة للنجاح' : 'Great Opportunity for Success'}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              {t('becomeProvider.hero.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {t('becomeProvider.hero.subtitle')}
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg h-16 px-10 rounded-2xl shadow-2xl"
              >
                {t('becomeProvider.hero.button')}
                <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
              <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
                <div className="text-4xl font-bold text-white mb-2">2,500+</div>
                <p className="text-white/80">{t('becomeProvider.stats.providers')}</p>
              </Card>
              <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
                <div className="text-4xl font-bold text-white mb-2">
                  {language === 'ar' ? '12,500 ر.س' : 'SAR 12,500'}
                </div>
                <p className="text-white/80">{t('becomeProvider.stats.earnings')}</p>
              </Card>
              <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
                <div className="text-4xl font-bold text-white mb-2">5,000+</div>
                <p className="text-white/80">{t('becomeProvider.stats.bookings')}</p>
              </Card>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('becomeProvider.benefits.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              );
            })}
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-2">{t('becomeProvider.requirements.title')}</h2>
              <p className="text-xl text-muted-foreground">{t('becomeProvider.requirements.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-2xl">{t('becomeProvider.requirements.docs.title')}</h3>
                </div>
                <ul className="space-y-3">
                  {documents.map((doc, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-muted-foreground">{doc}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-bold text-2xl">{t('becomeProvider.requirements.skills.title')}</h3>
                </div>
                <ul className="space-y-3">
                  {skills.map((skill, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-muted-foreground">{skill}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">{t('becomeProvider.steps.title')}</h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className={`absolute top-0 ${language === 'ar' ? 'right-6' : 'left-6'} bottom-0 w-0.5 bg-gradient-to-b from-primary to-secondary`}></div>
                {steps.map((step, index) => (
                  <div key={index} className="relative pb-12 last:pb-0">
                    <div className={`flex items-start gap-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <Card className="flex-1 p-6 hover:shadow-xl transition-shadow">
                        <p className="text-lg font-medium">{step}</p>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">{t('becomeProvider.cta.title')}</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('becomeProvider.cta.subtitle')}
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="btn-primary text-lg h-16 px-10 rounded-2xl shadow-xl"
              >
                {t('becomeProvider.cta.button')}
                <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
