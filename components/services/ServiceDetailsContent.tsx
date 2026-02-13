'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, Clock, CreditCard, Banknote, CheckCircle, XCircle,
  ShoppingCart, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Zap, Repeat, Calendar as CalendarIcon, ArrowRight,
  Shield, User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useBasket } from '@/lib/contexts/BasketContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface ServiceDetail {
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
  provider_description: string;
  provider_verification_status: string;
  provider_created_at: string;
  avg_rating: number;
  review_count: number;
}

interface Addon {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  is_required: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  created_at: string;
}

export function ServiceDetailsContent({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { addToBasket, isInBasket } = useBasket();
  const { user } = useAuth();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  // Booking options
  const [isUrgent, setIsUrgent] = useState(false);
  const [recurringType, setRecurringType] = useState<string>('none');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/services/${serviceId}`);
      const data = await res.json();

      if (data.success) {
        setService(data.data.service);
        setAddons(data.data.addons || []);
        setReviews(data.data.reviews || []);
      } else {
        setError(data.error || 'Failed to load service');
      }
    } catch (err) {
      setError('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = useMemo(() => {
    if (!service) return 0;
    let price = parseFloat(String(service.base_price));

    if (isUrgent && service.allow_urgent) {
      price += parseFloat(String(service.urgent_fee || 0));
    }

    // Add selected addons
    for (const addonId of selectedAddons) {
      const addon = addons.find((a) => a.id === addonId);
      if (addon) {
        price += parseFloat(String(addon.price));
      }
    }

    return price;
  }, [service, isUrgent, selectedAddons, addons]);

  const cancellationFee = useMemo(() => {
    if (!service) return 0;
    if (service.cancellation_type === 'percentage') {
      return (finalPrice * parseFloat(String(service.cancellation_value || 0))) / 100;
    }
    return parseFloat(String(service.cancellation_value || 0));
  }, [service, finalPrice]);

  const handleAddToBasket = () => {
    if (!service) return;

    if (!user || user.role !== 'customer') {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول كعميل' : 'You must be logged in as a customer');
      return;
    }

    if (!service.is_active) {
      toast.error(language === 'ar' ? 'هذه الخدمة غير متوفرة' : 'This service is not available');
      return;
    }

    const inBasket = isInBasket(service.id);
    if (inBasket) {
      toast.info(language === 'ar' ? 'هذه الخدمة موجودة بالفعل في السلة' : 'Service already in basket');
      return;
    }

    const selectedAddonDetails = addons
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        nameAr: a.name_ar,
        price: parseFloat(String(a.price)),
      }));

    addToBasket({
      serviceId: service.id,
      serviceName: service.name,
      serviceNameAr: service.name_ar,
      basePrice: parseFloat(String(service.base_price)),
      currency: service.currency || 'OMR',
      providerId: service.provider_id,
      providerName: service.provider_name,
      providerBusinessName: language === 'ar' ? (service.provider_name_ar || service.provider_name) : service.provider_name,
      image: service.images?.[0] || undefined,
      isUrgent,
      urgentFee: isUrgent ? parseFloat(String(service.urgent_fee || 0)) : 0,
      recurringType: recurringType !== 'none' ? (recurringType as 'daily' | 'weekly' | 'monthly') : null,
      addons: selectedAddonDetails,
      finalPrice,
    });

    toast.success(language === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to basket');
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{language === 'ar' ? 'خطأ' : 'Error'}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>{language === 'ar' ? 'رجوع' : 'Go Back'}</Button>
        </Card>
      </div>
    );
  }

  const serviceName = language === 'ar' ? (service.name_ar || service.name) : service.name;
  const serviceDesc = language === 'ar' ? (service.description_ar || service.description) : service.description;
  const categoryName = language === 'ar' ? (service.category_name_ar || service.category_name) : service.category_name;
  const providerName = language === 'ar' ? (service.provider_name_ar || service.provider_name) : service.provider_name;
  const images = service.images && service.images.length > 0 ? service.images : [];
  const inBasketAlready = isInBasket(service.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-3 px-4">
        <div className="container mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => router.push('/')} className="hover:text-primary transition-colors">
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <button onClick={() => router.push('/services')} className="hover:text-primary transition-colors">
            {language === 'ar' ? 'الخدمات' : 'Services'}
          </button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-medium">{serviceName}</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[imageIndex]}
                      alt={serviceName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => setImageIndex(i)}
                              className={`w-3 h-3 rounded-full transition-colors ${i === imageIndex ? 'bg-primary' : 'bg-background/60'}`}
                              aria-label={`Image ${i + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <span className="text-6xl font-bold text-primary/20">{serviceName.charAt(0)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Service Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{categoryName}</Badge>
                  <h1 className="text-3xl font-bold text-balance">{serviceName}</h1>
                </div>
                <div className="text-left shrink-0">
                  {service.is_active ? (
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
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(service.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                  <span className="font-semibold mr-2">{service.avg_rating?.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({service.review_count} {language === 'ar' ? 'تقييم' : 'reviews'})</span>
                </div>
                {service.duration_minutes && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration_minutes} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">{language === 'ar' ? 'وصف الخدمة' : 'Service Description'}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {serviceDesc || (language === 'ar' ? 'لا يوجد وصف' : 'No description available')}
                </p>
              </div>

              {/* Features from metadata */}
              {service.metadata?.features && service.metadata.features.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3">{language === 'ar' ? 'المميزات' : 'Features'}</h2>
                  <ul className="space-y-2">
                    {service.metadata.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payment Methods */}
              <div>
                <h2 className="text-lg font-bold mb-3">{language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}</h2>
                <div className="flex flex-wrap gap-3">
                  {service.payment_methods?.map((method: string) => (
                    <div
                      key={method}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted"
                    >
                      {method === 'instant' || method === 'card' ? (
                        <CreditCard className="h-5 w-5 text-primary" />
                      ) : (
                        <Banknote className="h-5 w-5 text-primary" />
                      )}
                      <span className="text-sm font-medium">
                        {method === 'instant' || method === 'card'
                          ? (language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card')
                          : (language === 'ar' ? 'الدفع عند الموعد' : 'Cash on Delivery')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Provider Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">{language === 'ar' ? 'مقدم الخدمة' : 'Service Provider'}</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {service.provider_logo ? (
                    <img src={service.provider_logo} alt={providerName} className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                  ) : (
                    <UserIcon className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{providerName}</h3>
                    {service.provider_verification_status === 'verified' && (
                      <Badge className="bg-primary/10 text-primary border-0">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        {language === 'ar' ? 'معتمد' : 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{parseFloat(String(service.provider_rating))?.toFixed(1)}</span>
                      <span>({service.provider_total_reviews} {language === 'ar' ? 'تقييم' : 'reviews'})</span>
                    </div>
                    <span>{service.provider_total_bookings} {language === 'ar' ? 'حجز' : 'bookings'}</span>
                  </div>
                  {service.provider_description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.provider_description}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">
                  {language === 'ar' ? 'التقييمات' : 'Reviews'} ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {review.avatar_url ? (
                            <img src={review.avatar_url} alt="" className="w-full h-full rounded-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <UserIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.first_name} {review.last_name}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground mr-auto">
                          {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Booking Options */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-20">
              <h2 className="text-lg font-bold mb-4">{language === 'ar' ? 'خيارات الحجز' : 'Booking Options'}</h2>

              {/* Base Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">{language === 'ar' ? 'السعر الأساسي' : 'Base Price'}</span>
                <span className="font-bold text-lg">
                  {parseFloat(String(service.base_price)).toFixed(2)} {service.currency || 'OMR'}
                </span>
              </div>

              <Separator className="my-4" />

              {/* Urgent Service */}
              {service.allow_urgent && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <Label htmlFor="urgent" className="font-medium cursor-pointer">
                        {language === 'ar' ? 'خدمة مستعجلة' : 'Urgent Service'}
                      </Label>
                    </div>
                    <Switch
                      id="urgent"
                      checked={isUrgent}
                      onCheckedChange={setIsUrgent}
                    />
                  </div>
                  {isUrgent && (
                    <p className="text-sm text-orange-500 mt-1 mr-6">
                      +{parseFloat(String(service.urgent_fee || 0)).toFixed(2)} {service.currency || 'OMR'}
                    </p>
                  )}
                </div>
              )}

              {/* Recurring */}
              {service.allow_recurring && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="h-4 w-4 text-primary" />
                    <Label className="font-medium">
                      {language === 'ar' ? 'حجز متكرر' : 'Recurring Booking'}
                    </Label>
                  </div>
                  <Select value={recurringType} onValueChange={setRecurringType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{language === 'ar' ? 'مرة واحدة' : 'One time'}</SelectItem>
                      <SelectItem value="daily">{language === 'ar' ? 'يومي' : 'Daily'}</SelectItem>
                      <SelectItem value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                      <SelectItem value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Addons */}
              {addons.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">{language === 'ar' ? 'إضافات' : 'Add-ons'}</h3>
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAddons.includes(addon.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.id) || addon.is_required}
                            onChange={() => !addon.is_required && toggleAddon(addon.id)}
                            disabled={addon.is_required}
                            className="rounded border-border"
                          />
                          <span className="text-sm">
                            {language === 'ar' ? (addon.name_ar || addon.name) : addon.name}
                          </span>
                          {addon.is_required && (
                            <Badge variant="outline" className="text-xs">{language === 'ar' ? 'مطلوب' : 'Required'}</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          +{parseFloat(String(addon.price)).toFixed(2)} {service.currency || 'OMR'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              {/* Final Price */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{language === 'ar' ? 'السعر النهائي' : 'Final Price'}</span>
                <span className="font-bold text-2xl text-primary">
                  {finalPrice.toFixed(2)} {service.currency || 'OMR'}
                </span>
              </div>

              {/* Cancellation Policy */}
              {service.cancellation_type && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{language === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {language === 'ar'
                      ? `إلغاء مجاني قبل ${service.free_cancellation_hours || 0} ساعة. رسوم الإلغاء: ${cancellationFee.toFixed(2)} ${service.currency || 'OMR'}`
                      : `Free cancellation up to ${service.free_cancellation_hours || 0} hours before. Cancellation fee: ${cancellationFee.toFixed(2)} ${service.currency || 'OMR'}`}
                  </p>
                </div>
              )}

              {/* Add to Basket Button */}
              <Button
                onClick={handleAddToBasket}
                disabled={!service.is_active || inBasketAlready}
                className="w-full h-12 text-base"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 ml-2" />
                {inBasketAlready
                  ? (language === 'ar' ? 'موجودة في السلة' : 'Already in Basket')
                  : (language === 'ar' ? 'أضف إلى السلة' : 'Add to Basket')}
              </Button>

              {inBasketAlready && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => router.push('/basket')}
                >
                  {language === 'ar' ? 'عرض السلة' : 'View Basket'}
                </Button>
              )}

              {/* Min Advance Hours Warning */}
              {service.min_advance_hours > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {language === 'ar'
                    ? `يجب الحجز قبل ${service.min_advance_hours} ساعة على الأقل`
                    : `Must book at least ${service.min_advance_hours} hours in advance`}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
