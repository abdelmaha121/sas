'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, CreditCard, Banknote, CheckCircle, XCircle, ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useBasket } from '@/lib/contexts/BasketContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

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

function isServiceAvailable(service: ServiceData): boolean {
  return service.is_active;
}

function getPaymentMethodIcon(method: string) {
  if (method === 'instant' || method === 'card') {
    return <CreditCard className="h-4 w-4" />;
  }
  return <Banknote className="h-4 w-4" />;
}

function getPaymentMethodLabel(method: string, language: string) {
  if (method === 'instant' || method === 'card') {
    return language === 'ar' ? 'بطاقة' : 'Card';
  }
  return language === 'ar' ? 'عند الموعد' : 'Cash';
}

export function ServiceCard({ service }: { service: ServiceData }) {
  const { language } = useLanguage();
  const { addToBasket, isInBasket } = useBasket();
  const { user } = useAuth();
  const [imageIndex, setImageIndex] = useState(0);

  const available = isServiceAvailable(service);
  const inBasket = isInBasket(service.id);
  const images = service.images && service.images.length > 0 ? service.images : [];
  const serviceName = language === 'ar' ? (service.name_ar || service.name) : service.name;
  const serviceDesc = language === 'ar' ? (service.description_ar || service.description) : service.description;
  const categoryName = language === 'ar' ? (service.category_name_ar || service.category_name) : service.category_name;
  const providerName = language === 'ar' ? (service.provider_name_ar || service.provider_name) : service.provider_name;

  const handleAddToBasket = () => {
    if (!user || user.role !== 'customer') {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول كعميل لإضافة الخدمة للسلة' : 'You must be logged in as a customer to add to basket');
      return;
    }

    if (!available) {
      toast.error(language === 'ar' ? 'هذه الخدمة غير متوفرة حاليا' : 'This service is not currently available');
      return;
    }

    if (inBasket) {
      toast.info(language === 'ar' ? 'هذه الخدمة موجودة بالفعل في السلة' : 'This service is already in your basket');
      return;
    }

    addToBasket({
      serviceId: service.id,
      serviceName: service.name,
      serviceNameAr: service.name_ar,
      basePrice: parseFloat(String(service.base_price)),
      currency: service.currency || 'OMR',
      providerId: service.provider_id,
      providerName: service.provider_name,
      providerBusinessName: providerName,
      image: images[0] || undefined,
      isUrgent: false,
      urgentFee: parseFloat(String(service.urgent_fee || 0)),
      recurringType: null,
      addons: [],
      finalPrice: parseFloat(String(service.base_price)),
    });

    toast.success(language === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to basket');
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 flex flex-col">
      {/* Image Carousel */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[imageIndex]}
              alt={serviceName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              crossOrigin="anonymous"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); setImageIndex((i) => (i - 1 + images.length) % images.length); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setImageIndex((i) => (i + 1) % images.length); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_: string, i: number) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imageIndex ? 'bg-primary' : 'bg-background/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-4xl font-bold text-primary/30">{serviceName.charAt(0)}</span>
          </div>
        )}

        {/* Availability badge */}
        <div className="absolute top-3 right-3">
          {available ? (
            <Badge className="bg-green-500 text-primary-foreground border-0">
              <CheckCircle className="h-3 w-3 ml-1" />
              {language === 'ar' ? 'متوفرة' : 'Available'}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 ml-1" />
              {language === 'ar' ? 'غير متوفرة' : 'Unavailable'}
            </Badge>
          )}
        </div>

        {/* Category badge */}
        {categoryName && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {categoryName}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {serviceName}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {serviceDesc || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
          </p>

          {/* Provider */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="font-medium">{providerName}</span>
            {service.provider_verification_status === 'verified' && (
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
            )}
          </div>

          {/* Rating & Duration */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{service.avg_rating?.toFixed(1) || '0.0'}</span>
              <span className="text-muted-foreground">({service.review_count || 0})</span>
            </div>
            {service.duration_minutes && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{service.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-2 mb-4">
            {service.payment_methods?.map((method: string) => (
              <div
                key={method}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                title={getPaymentMethodLabel(method, language)}
              >
                {getPaymentMethodIcon(method)}
                <span>{getPaymentMethodLabel(method, language)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="border-t pt-4 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-primary">
                {parseFloat(String(service.base_price)).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground mr-1">
                {service.currency || 'OMR'}
              </span>
            </div>
            {service.allow_urgent && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                {language === 'ar' ? 'خدمة مستعجلة' : 'Urgent Available'}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddToBasket}
              disabled={!available || inBasket}
              className="flex-1"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 ml-2" />
              {inBasket
                ? (language === 'ar' ? 'في السلة' : 'In Basket')
                : (language === 'ar' ? 'أضف للسلة' : 'Add to Basket')}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/services/${service.id}`}>
                <Eye className="h-4 w-4 ml-1" />
                {language === 'ar' ? 'التفاصيل' : 'Details'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
