'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Wrench,
  Home,
  Car,
  Laptop,
  Paintbrush,
  Zap,
  Shield,
  Clock,
  Star,
  TrendingUp,
  MapPin,
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatWidget } from '@/components/ui/ChatWidget';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const iconMap: Record<string, any> = {
  Home, Car, Laptop, Wrench, Paintbrush, Zap, Shield, Clock, Star, TrendingUp, MapPin, Sparkles
};

const colorGradients = [
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-cyan-500',
];

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category_name: string;
  provider_name: string;
  provider_logo: string;
  avg_rating: number;
  review_count: number;
  payment_methods?: string[];
}

interface Provider {
  id: number;
  business_name: string;
  description: string;
  logo: string;
  city: string;
  address: string;
  avg_rating: number;
  service_count: number;
}

interface SearchResults {
  categories: Category[];
  services: Service[];
  providers: Provider[];
  explanation?: string;
}

interface AIRecommendations {
  services: Service[];
  explanation: string;
}

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [topProviders, setTopProviders] = useState<Provider[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/home');
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories || []);
        setFeaturedServices(data.featuredServices || []);
        setTopProviders(data.topProviders || []);
        setAiRecommendations(data.aiRecommendations || null);
      } else {
        setError('فشل تحميل البيانات');
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setIsSearching(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const displayCategories = searchResults?.categories?.length ? searchResults.categories : categories;
  const displayServices = searchResults?.services?.length ? searchResults.services : featuredServices;
  const displayProviders = searchResults?.providers?.length ? searchResults.providers : topProviders;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-center mb-2">{t('common.error')}</h3>
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchHomeData} className="w-full">
            {t('common.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Sparkles className="w-4 h-4 ml-2" />
              {t('home.hero.badge')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder={t('home.hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-6 py-4 rounded-2xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring text-lg shadow-lg"
                />
              </div>
              <Button size="lg" className="btn-primary text-lg h-14 px-8 rounded-2xl shadow-lg" onClick={() => searchQuery && performSearch()}>
                {t('home.hero.searchButton')}
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </div>

            {searchQuery && searchResults && (
              <div className="mt-4 p-4 bg-card/50 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {language === 'ar' ? 'نتائج البحث الذكية' : 'Smart Search Results'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                 {language === 'ar'  ? `نتائج البحث: ${displayCategories.length + displayServices.length + displayProviders.length} نتائج` : `Search Results: ${displayCategories.length + displayServices.length + displayProviders.length} results`}
                </div>

                {searchResults.explanation && (
                  <div className="text-xs text-muted-foreground">
                    <strong>{language === 'ar' ? 'شرح الذكاء الاصطناعي:' : 'AI Explanation:'}</strong> {searchResults.explanation}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>{t('home.hero.guarantee')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{t('home.hero.fastDelivery')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span>{t('home.hero.certified')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-background to-secondary/10">
  <div className="container mx-auto max-w-4xl text-center">
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-primary/20">
      <div className="flex items-center justify-center mb-6">
        <Zap className="h-10 w-10 text-primary mr-3" />
        <h2 className="text-4xl font-bold text-primary">
          {language === 'ar' ? 'أفكار وخدمات مبتكرة' : 'Innovative Ideas & Services'}
        </h2>
      </div>
      <p className="text-lg text-muted-foreground leading-relaxed">
        {language === 'ar'
          ? 'اكتشف مجموعة من الخدمات والأفكار التي تساعدك في حياتك اليومية، مع ضمان الجودة والموثوقية لكل ما تحتاجه.'
          : 'Discover a range of services and ideas that help you in daily life, ensuring quality and reliability for everything you need.'}
      </p>
    </div>
  </div>
</section>


      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t('home.categories.title')}</h2>
              <p className="text-muted-foreground">{t('home.categories.subtitle')}</p>
            </div>
            <Link href="/services">
              <Button variant="ghost">
                {t('common.viewAll')}
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {displayCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {displayCategories.map((category, index) => {
                const Icon = iconMap[category.icon] || Wrench;
                const colorClass = colorGradients[index % colorGradients.length];
                return (
                  <Link key={category.id} href={`/services?category=${category.id}`}>
                    <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-center group-hover:text-primary transition-colors text-sm">
                        {category.name}
                      </h3>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common.noResults')}</p>
            </Card>
          )}
        </div>
      </section>

      {/* AI-Powered Recommendations Section */}
      {aiRecommendations && aiRecommendations.services && aiRecommendations.services.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-3xl font-bold">{language === 'ar' ? 'توصيات ذكية بالذكاء الاصطناعي' : 'AI-Powered Recommendations'}</h2>
                </div>
                <p className="text-muted-foreground">{aiRecommendations.explanation}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Zap className="w-4 h-4 ml-1" />
                {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiRecommendations.services.map((service) => (
                <Card key={service.id} className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-2">
                        {service.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{service.category_name}</span>
                        <span>•</span>
                        <span>{service.provider_name}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-primary">
                        ${service.price}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{service.avg_rating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-muted-foreground">({service.review_count || 0})</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm" onClick={() => {
                    // TODO: Navigate to booking page with service details
                    console.log('Book service:', service.id);
                  }}>
                    {language === 'ar' ? 'حجز الآن' : 'Book Now'}
                    <ChevronLeft className="mr-2 h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">{t('home.why.title')}</h2>
            <p className="text-muted-foreground">{t('home.why.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('home.why.certified')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('home.why.certifiedDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('home.why.fast')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('home.why.fastDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('home.why.quality')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('home.why.qualityDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('home.why.coverage')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('home.why.coverageDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/become-provider">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8 rounded-2xl shadow-lg"
              >
                {t('home.cta.register')}
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg h-14 px-8 rounded-2xl"
              >
                {t('home.cta.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}

