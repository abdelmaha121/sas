'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Upload, CheckCircle2, Clock } from 'lucide-react';

interface ActiveBooking {
  id: string;
  service_name: string;
  service_name_ar: string;
  provider_name: string;
  provider_name_ar: string;
  provider_phone: string;
  status: string;
  scheduled_at: string;
  customer_address: any;
  total_amount: number;
  currency: string;
  notes: string;
  metadata: any;
}

export default function ActiveBookingPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveBooking();
    }
  }, [user]);

  const loadActiveBooking = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ bookings: ActiveBooking[] }>(
        '/bookings?status=confirmed,in_progress&limit=1'
      );

      if (data.bookings && data.bookings.length > 0) {
        setBooking(data.bookings[0]);
      }
    } catch (error) {
      console.error('Failed to load active booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statuses: any = {
      pending: {
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        color: 'bg-yellow-500',
      },
      confirmed: {
        label: language === 'ar' ? 'مؤكد' : 'Confirmed',
        color: 'bg-blue-500',
      },
      in_progress: {
        label: language === 'ar' ? 'جاري التنفيذ' : 'In Progress',
        color: 'bg-green-500',
      },
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
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

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'لا توجد حجوزات نشطة' : 'No Active Bookings'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'ar'
              ? 'ليس لديك أي حجوزات نشطة حالياً'
              : 'You have no active bookings at the moment'}
          </p>
          <Button onClick={() => window.location.href = '/services'}>
            {language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(booking.status);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">
          {language === 'ar' ? 'تتبع الحجز' : 'Track Booking'}
        </h1>

        {/* Status Timeline */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'حالة الحجز' : 'Booking Status'}
          </h2>

          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full ${statusInfo.color} flex items-center justify-center text-white`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-center mt-2 text-sm font-medium">{statusInfo.label}</p>
            </div>

            {booking.status === 'in_progress' && (
              <div className="flex-1">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-center mt-2 text-sm font-medium">
                  {language === 'ar' ? 'جاري العمل' : 'Working'}
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {language === 'ar' ? 'الموعد المحدد:' : 'Scheduled:'}{' '}
              {new Date(booking.scheduled_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </Badge>
          </div>
        </Card>

        {/* Service Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'الخدمة' : 'Service'}
              </p>
              <p className="font-semibold">
                {language === 'ar' ? booking.service_name_ar : booking.service_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'مقدم الخدمة' : 'Provider'}
              </p>
              <p className="font-semibold">
                {language === 'ar' ? booking.provider_name_ar : booking.provider_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
              </p>
              <p className="font-semibold text-2xl text-primary">
                {booking.total_amount} {booking.currency}
              </p>
            </div>

            {booking.customer_address && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'العنوان' : 'Address'}
                </p>
                <p className="font-medium">
                  {typeof booking.customer_address === 'string'
                    ? booking.customer_address
                    : JSON.stringify(booking.customer_address)}
                </p>
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Actions */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'التواصل' : 'Contact'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = `tel:${booking.provider_phone}`}
            >
              <Phone className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'اتصال' : 'Call Provider'}
            </Button>

            <Button variant="outline" className="w-full" disabled>
              <MessageCircle className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'دردشة' : 'Chat'}
              <span className="text-xs ml-2">({language === 'ar' ? 'قريباً' : 'Soon'})</span>
            </Button>
          </div>
        </Card>

        {/* Upload Section */}
        {booking.status === 'in_progress' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'الصور والمرفقات' : 'Photos & Attachments'}
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {language === 'ar'
                  ? 'قريباً سيتمكن مقدم الخدمة من رفع صور قبل وبعد العمل'
                  : 'Provider will be able to upload before/after photos soon'}
              </p>
              <Button disabled>
                {language === 'ar' ? 'قريباً' : 'Coming Soon'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
