'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Trash2, Loader2, AlertCircle, Calendar as CalendarIcon,
  Clock, CreditCard, Banknote, Zap, Repeat, ArrowRight,
  Shield, CheckCircle, XCircle, User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useBasket } from '@/lib/contexts/BasketContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { BasketItemCard } from './BasketItemCard';

export function BasketPageContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const { items, totalItems, totalPrice, clearBasket, removeFromBasket, updateBasketItem } = useBasket();
  const { user } = useAuth();

  const [generalNotes, setGeneralNotes] = useState('');
  const [paymentType, setPaymentType] = useState<string>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  // Calculate total cancellation fees
  const totalCancellationFee = useMemo(() => {
    // This is an estimate based on service data stored in basket
    return 0; // We don't have cancellation data in basket items
  }, [items]);

  const handleSubmitBooking = async () => {
    if (!user || user.role !== 'customer') {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول كعميل' : 'You must be logged in as a customer');
      return;
    }

    if (items.length === 0) {
      toast.error(language === 'ar' ? 'السلة فارغة' : 'Basket is empty');
      return;
    }

    // Validate date/time for each item
    for (const item of items) {
      if (!item.scheduledDate || !item.scheduledTime) {
        toast.error(
          language === 'ar'
            ? `يرجى تحديد التاريخ والوقت لخدمة: ${item.serviceNameAr || item.serviceName}`
            : `Please set date and time for: ${item.serviceName}`
        );
        return;
      }
    }

    // Validate card data if payment type is instant
    if (paymentType === 'instant') {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv) {
        toast.error(language === 'ar' ? 'يرجى إدخال بيانات البطاقة' : 'Please enter card details');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build basket items for bulk booking API
      const basketItems = items.map((item) => ({
        serviceId: item.serviceId,
        providerId: item.providerId,
        scheduledAt: `${item.scheduledDate}T${item.scheduledTime}:00`,
        customerAddress: user.address || null,
        notes: item.notes || null,
        addons: item.addons?.map((a) => a.id) || [],
        isUrgent: item.isUrgent,
        recurringType: item.recurringType || 'none',
      }));

      // Create all bookings in a single transaction
      const bookingRes = await fetch('/api/bookings/basket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-subdomain': 'demo',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: basketItems,
          generalNotes,
          paymentType,
        }),
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok) {
        throw new Error(bookingData.error || 'Failed to create bookings');
      }

      // If instant payment, process payments for each booking
      if (paymentType === 'instant' && bookingData.bookings) {
        for (const booking of bookingData.bookings) {
          const paymentRes = await fetch('/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-subdomain': 'demo',
            },
            credentials: 'include',
            body: JSON.stringify({
              bookingId: booking.bookingId,
              amount: booking.totalAmount,
              currency: 'OMR',
              paymentMethod: 'card',
              cardData: {
                cardNumber: cardData.cardNumber.replace(/\s/g, ''),
                cardHolder: cardData.cardHolder,
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear,
                cvv: cardData.cvv,
              },
            }),
          });

          const paymentData = await paymentRes.json();
          if (!paymentRes.ok) {
            throw new Error(paymentData.error || 'Payment failed');
          }
        }
      }

      toast.success(
        language === 'ar'
          ? `تم تأكيد ${bookingData.totalBookings} حجز بنجاح`
          : `${bookingData.totalBookings} booking(s) confirmed successfully`
      );

      clearBasket();
      router.push('/customer/bookings');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل إنشاء الحجز' : 'Failed to create booking'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'ar' ? 'يجب تسجيل الدخول كعميل لعرض سلة الحجز' : 'You must sign in as a customer to view your basket'}
          </p>
          <Button asChild>
            <Link href="/auth/login">{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'السلة فارغة' : 'Your Basket is Empty'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'ar' ? 'ابدأ بإضافة خدمات إلى سلة الحجز' : 'Start adding services to your booking basket'}
          </p>
          <Button asChild>
            <Link href="/services">{language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-3 px-4">
        <div className="container mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => router.push('/')} className="hover:text-primary transition-colors">
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-medium">
            {language === 'ar' ? 'سلة الحجز' : 'Booking Basket'}
          </span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'سلة الحجز' : 'Booking Basket'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? `${totalItems} خدمة في السلة`
                : `${totalItems} service(s) in basket`}
            </p>
          </div>
          <Button variant="outline" onClick={clearBasket} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 ml-2" />
            {language === 'ar' ? 'إفراغ السلة' : 'Clear Basket'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <BasketItemCard
                key={item.id}
                item={item}
                onRemove={removeFromBasket}
                onUpdate={updateBasketItem}
              />
            ))}

            {/* General Notes */}
            <Card className="p-6">
              <h3 className="font-bold mb-3">
                {language === 'ar' ? 'ملاحظات عامة للسلة' : 'General Notes'}
              </h3>
              <Textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={language === 'ar' ? 'أضف ملاحظات عامة لجميع الخدمات...' : 'Add general notes for all services...'}
                rows={3}
              />
            </Card>
          </div>

          {/* Sidebar - Summary & Checkout */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'بيانات العميل' : 'Customer Info'}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                {user.phone && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                {user.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'العنوان' : 'Address'}</Label>
                    <p className="font-medium">{user.address}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Type */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </h3>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentType === 'instant' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="instant" id="instant" />
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{language === 'ar' ? 'الدفع الفوري بالبطاقة' : 'Pay Now with Card'}</p>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'Visa, Mastercard' : 'Visa, Mastercard'}</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentType === 'cash_on_delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="cash_on_delivery" id="cash" />
                  <Banknote className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{language === 'ar' ? 'الدفع عند الموعد' : 'Pay on Appointment'}</p>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'ادفع نقدا عند الخدمة' : 'Pay cash at service time'}</p>
                  </div>
                </label>
              </RadioGroup>

              {/* Card Form */}
              {paymentType === 'instant' && (
                <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs">{language === 'ar' ? 'رقم البطاقة' : 'Card Number'}</Label>
                    <Input
                      placeholder="4111 1111 1111 1111"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{language === 'ar' ? 'اسم حامل البطاقة' : 'Card Holder'}</Label>
                    <Input
                      placeholder={language === 'ar' ? 'الاسم على البطاقة' : 'Name on card'}
                      value={cardData.cardHolder}
                      onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'الشهر' : 'Month'}</Label>
                      <Input
                        placeholder="MM"
                        value={cardData.expiryMonth}
                        onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'السنة' : 'Year'}</Label>
                      <Input
                        placeholder="YY"
                        value={cardData.expiryYear}
                        onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CVV</Label>
                      <Input
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {language === 'ar' ? 'جميع المعاملات مشفرة ومؤمنة' : 'All transactions are encrypted and secure'}
                  </p>
                </div>
              )}
            </Card>

            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground line-clamp-1 flex-1 ml-2">
                      {language === 'ar' ? (item.serviceNameAr || item.serviceName) : item.serviceName}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {item.finalPrice.toFixed(2)} {item.currency || 'OMR'}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between font-bold text-lg">
                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-primary">
                  {totalPrice.toFixed(2)} OMR
                </span>
              </div>

              <Button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="w-full mt-6 h-12 text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    {language === 'ar' ? 'جاري التأكيد...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 ml-2" />
                    {language === 'ar'
                      ? `تأكيد الحجز (${totalPrice.toFixed(2)} OMR)`
                      : `Confirm Booking (${totalPrice.toFixed(2)} OMR)`}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {language === 'ar'
                  ? 'سيتم حجز جميع الخدمات في السلة دفعة واحدة'
                  : 'All services in basket will be booked at once'}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
