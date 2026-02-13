'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, UserCheck, Calendar, CheckCircle, Shield, Headphones, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const customerSteps = [
    {
      icon: Search,
      title: t('howItWorks.customer.step1.title'),
      description: t('howItWorks.customer.step1.desc'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UserCheck,
      title: t('howItWorks.customer.step2.title'),
      description: t('howItWorks.customer.step2.desc'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Calendar,
      title: t('howItWorks.customer.step3.title'),
      description: t('howItWorks.customer.step3.desc'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.customer.step4.title'),
      description: t('howItWorks.customer.step4.desc'),
      color: 'from-orange-500 to-red-500',
    },
  ];

  const providerSteps = [
    {
      icon: UserCheck,
      title: t('howItWorks.provider.step1.title'),
      description: t('howItWorks.provider.step1.desc'),
      color: 'from-primary to-secondary',
    },
    {
      icon: Calendar,
      title: t('howItWorks.provider.step2.title'),
      description: t('howItWorks.provider.step2.desc'),
      color: 'from-secondary to-primary',
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.provider.step3.title'),
      description: t('howItWorks.provider.step3.desc'),
      color: 'from-green-500 to-teal-500',
    },
    {
      icon: Zap,
      title: t('howItWorks.provider.step4.title'),
      description: t('howItWorks.provider.step4.desc'),
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: t('howItWorks.features.secure.title'),
      description: t('howItWorks.features.secure.desc'),
      color: 'bg-green-500/10 text-green-600',
    },
    {
      icon: Headphones,
      title: t('howItWorks.features.support.title'),
      description: t('howItWorks.features.support.desc'),
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Award,
      title: t('howItWorks.features.quality.title'),
      description: t('howItWorks.features.quality.desc'),
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      icon: Zap,
      title: t('howItWorks.features.fast.title'),
      description: t('howItWorks.features.fast.desc'),
      color: 'bg-orange-500/10 text-orange-600',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">{t('howItWorks.hero.title')}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.hero.subtitle')}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-3">{t('howItWorks.customer.title')}</h2>
              <p className="text-xl text-muted-foreground">{t('howItWorks.customer.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {customerSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    <Card className="p-6 h-full hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center relative`}
                        >
                          <Icon className="h-10 w-10 text-white" />
                          <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-center">{step.title}</h3>
                      <p className="text-muted-foreground text-center leading-relaxed">
                        {step.description}
                      </p>
                    </Card>
                    {index < customerSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -left-4 w-8 h-0.5 bg-gradient-to-l from-primary to-transparent"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-3">{t('howItWorks.provider.title')}</h2>
              <p className="text-xl text-muted-foreground">{t('howItWorks.provider.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {providerSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    <Card className="p-6 h-full hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center mb-6">
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center relative`}
                        >
                          <Icon className="h-10 w-10 text-white" />
                          <div className="absolute -top-3 -right-3 w-10 h-10 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-center">{step.title}</h3>
                      <p className="text-muted-foreground text-center leading-relaxed">
                        {step.description}
                      </p>
                    </Card>
                    {index < providerSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -left-4 w-8 h-0.5 bg-gradient-to-l from-secondary to-transparent"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-3">{t('howItWorks.features.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                    <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-secondary py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('home.cta.title')}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('home.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8 rounded-2xl shadow-lg"
                >
                  {t('howItWorks.cta.customer')}
                </Button>
              </Link>
              <Link href="/become-provider">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg h-14 px-8 rounded-2xl"
                >
                  {t('howItWorks.cta.provider')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
