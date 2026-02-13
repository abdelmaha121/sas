'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown, Loader2, AlertCircle, ShoppingCart, Star, Clock, CreditCard, Banknote, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useBasket } from '@/lib/contexts/BasketContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { ServiceCard } from './ServiceCard';

interface ServiceData {
  id: string;
  provider_id: string;
  category_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  base_price: number;
  currency: string;
  duration_minutes: number;
  pricing_type: string;
  booking_type: string;
  allow_recurring: boolean;
  allow_urgent: boolean;
  urgent_fee: number;
  min_advance_hours: number;
  free_cancellation_hours: number;
  cancellation_type: string;
  cancellation_value: number;
  is_active: boolean;
  images: string[];
  availability: any[];
  payment_methods: string[];
  metadata: any;
  category_name: string;
  category_name_ar: string;
  provider_name: string;
  provider_name_ar: string;
  provider_logo: string;
  provider_rating: number;
  provider_total_reviews: number;
  provider_total_bookings: number;
  provider_verification_status: string;
  avg_rating: number;
  review_count: number;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

export function ServicesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [services, setServices] = useState<ServiceData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.set('category_id', selectedCategory);
      params.set('sort', sortBy);
      params.set('page', currentPage.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setServices(data.data.services);
        setTotalPages(data.data.pagination.totalPages);
        setTotalResults(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-balance">
              {language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'ar' ? 'اكتشف أفضل الخدمات المتاحة' : 'Discover the best available services'}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن خدمة...' : 'Search for a service...'}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-12 pl-4 py-6 rounded-xl text-base"
              />
            </div>

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-56 h-[52px] rounded-xl">
                <SlidersHorizontal className="h-4 w-4 ml-2" />
                <SelectValue placeholder={language === 'ar' ? 'جميع الفئات' : 'All Categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'ar' ? cat.nameAr || cat.name : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-56 h-[52px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{language === 'ar' ? 'الأكثر طلبا' : 'Most Popular'}</SelectItem>
                <SelectItem value="price_asc">{language === 'ar' ? 'السعر: الأقل' : 'Price: Low to High'}</SelectItem>
                <SelectItem value="price_desc">{language === 'ar' ? 'السعر: الأعلى' : 'Price: High to Low'}</SelectItem>
                <SelectItem value="rating">{language === 'ar' ? 'الأعلى تقييما' : 'Highest Rated'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {language === 'ar'
                ? `تم العثور على ${totalResults} خدمة`
                : `${totalResults} services found`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{language === 'ar' ? 'جاري تحميل الخدمات...' : 'Loading services...'}</p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{language === 'ar' ? 'لا توجد نتائج' : 'No Results'}</h3>
              <p className="text-muted-foreground mb-6">
                {language === 'ar' ? 'لم يتم العثور على خدمات تطابق معايير البحث' : 'No services match your search criteria'}
              </p>
              <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {language === 'ar'
                      ? `${currentPage} من ${totalPages}`
                      : `${currentPage} of ${totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
