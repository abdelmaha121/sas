'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, FileText, RotateCcw } from 'lucide-react';

interface Booking {
  id: string;
  service_name: string;
  service_name_ar: string;
  service_id: string;
  provider_name: string;
  provider_name_ar: string;
  status: string;
  scheduled_at: string;
  completed_at?: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  has_review: boolean;
}

export default function BookingHistoryPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'all'
        ? '/bookings?sort_by=created_at&sort_order=DESC'
        : `/bookings?status=${filter}&sort_by=created_at&sort_order=DESC`;

      const data = await api.get<{ bookings: Booking[] }>(endpoint);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: {
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        variant: 'secondary',
      },
      confirmed: {
        label: language === 'ar' ? 'مؤكد' : 'Confirmed',
        variant: 'default',
      },
      in_progress: {
        label: language === 'ar' ? 'جاري التنفيذ' : 'In Progress',
        variant: 'default',
      },
      completed: {
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        variant: 'default',
      },
      cancelled: {
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        variant: 'destructive',
      },
      refunded: {
        label: language === 'ar' ? 'مسترد' : 'Refunded',
        variant: 'outline',
      },
    };
    return statuses[status] || statuses.pending;
  };

  const handleRebook = (serviceId: string) => {
    // Removed navigation to service details page
  };

  const handleReview = (bookingId: string) => {
    window.location.href = `/customer/reviews/create?booking_id=${bookingId}`;
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'سجل الحجوزات' : 'Booking History'}
          </h1>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              {language === 'ar' ? 'مكتمل' : 'Completed'}
            </Button>
            <Button
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('cancelled')}
            >
              {language === 'ar' ? 'ملغي' : 'Cancelled'}
            </Button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
            </p>
            <Button onClick={() => window.location.href = '/services'}>
              {language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusBadge = getStatusBadge(booking.status);

              return (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {language === 'ar' ? booking.service_name_ar : booking.service_name}
                        </h3>
                        <Badge variant={statusBadge.variant as any}>
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'مقدم الخدمة: ' : 'Provider: '}
                        {language === 'ar' ? booking.provider_name_ar : booking.provider_name}
                      </p>

                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(booking.scheduled_at).toLocaleString(
                          language === 'ar' ? 'ar-SA' : 'en-US'
                        )}
                      </p>

                      <p className="text-lg font-bold text-primary mt-2">
                        {booking.total_amount} {booking.currency}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/booking/${booking.id}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                      </Button>

                      {booking.status === 'completed' && !booking.has_review && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReview(booking.id)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'تقييم' : 'Leave Review'}
                        </Button>
                      )}

                      {booking.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRebook(booking.service_id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'إعادة الحجز' : 'Rebook'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
