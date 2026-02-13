'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, X, Star, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await api.get(`/bookings?customer_id=${user.id}`) as any;
        setBookings(response?.data?.data?.bookings || response?.data?.bookings || []);
        setError('');
      } catch (error: any) {
        setError(error.message || (language === 'ar' ? 'فشل في تحميل الحجوزات' : 'Failed to load bookings'));
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id, language]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      await api.put(`/bookings/${bookingId}`, { status: 'cancelled' });
      setBookings(bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
    } catch (error: any) {
      setError(error.message || (language === 'ar' ? 'فشل في إلغاء الحجز' : 'Failed to cancel booking'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setReviewRating(0);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedBooking || reviewRating < 1) return;

    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        bookingId: selectedBooking.id,
        rating: reviewRating,
        comment: reviewComment || null,
      });

      setReviewDialogOpen(false);
      setSelectedBooking(null);
      // Refresh bookings to hide the review button
      const response = await api.get(`/bookings?customer_id=${user?.id}`) as any;
      setBookings(response?.data?.data?.bookings || response?.data?.bookings || []);
    } catch (error: any) {
      setError(error.message || (language === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReviewBooking = (booking: any) => {
    return booking.status === 'completed' && booking.completed_at && !booking.has_review;
  };

  const canCancelBooking = (booking: any) => {
    return ['pending', 'confirmed'].includes(booking.status);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
      confirmed: { variant: 'default', label: language === 'ar' ? 'مؤكد' : 'Confirmed' },
      in_progress: { variant: 'default', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
      completed: { variant: 'outline', label: language === 'ar' ? 'مكتمل' : 'Completed' },
      cancelled: { variant: 'destructive', label: language === 'ar' ? 'ملغى' : 'Cancelled' },
      refunded: { variant: 'destructive', label: language === 'ar' ? 'مسترجع' : 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
      paid: { variant: 'outline', label: language === 'ar' ? 'مدفوع' : 'Paid' },
      failed: { variant: 'destructive', label: language === 'ar' ? 'فشل' : 'Failed' },
      refunded: { variant: 'destructive', label: language === 'ar' ? 'مسترجع' : 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'الرجاء تسجيل الدخول' : 'Please login'}
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/customer/profile')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'العودة' : 'Back'}
            </Button>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
            </h1>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <p className="text-red-800">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {booking.service_name_ar && language === 'ar' ? booking.service_name_ar : booking.service_name}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'}</span>
                          <span className="text-xs font-mono">{booking.id.substring(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.scheduled_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(booking.scheduled_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.provider_name_ar && language === 'ar' ? booking.provider_name_ar : booking.provider_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{booking.total_amount} {booking.currency}</span>
                        </div>
                        {booking.booking_type && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {language === 'ar' ? 'النوع:' : 'Type:'}
                            </span>
                            <span>
                              {language === 'ar' 
                                ? (booking.booking_type === 'one_time' ? 'لمرة واحدة' : booking.booking_type === 'recurring' ? 'متكرر' : 'طوارئ')
                                : (booking.booking_type === 'one_time' ? 'One Time' : booking.booking_type === 'recurring' ? 'Recurring' : 'Emergency')
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {booking.completed_at && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {language === 'ar' ? 'اكتمل في:' : 'Completed at:'} 
                          </span>
                          {' '}{new Date(booking.completed_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/track-booking/${booking.id}`)}
                        className="w-full md:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تتبع الطلب' : 'Track Order'}
                      </Button>
                      {canCancelBooking(booking) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="w-full md:w-auto"
                        >
                          {cancellingId === booking.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </>
                          )}
                        </Button>
                      )}
                      {canReviewBooking(booking) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReviewBooking(booking)}
                          className="w-full md:w-auto"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'قيّم الخدمة' : 'Rate Service'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Review Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'قيّم الخدمة' : 'Rate the Service'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {selectedBooking && (
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">
                      {selectedBooking.service_name_ar && language === 'ar'
                        ? selectedBooking.service_name_ar
                        : selectedBooking.service_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.provider_name_ar && language === 'ar'
                        ? selectedBooking.provider_name_ar
                        : selectedBooking.provider_name}
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <Label className="text-sm font-medium mb-4 block">
                    {language === 'ar' ? 'كم عدد النجوم التي تعطيها لهذه الخدمة؟' : 'How many stars would you give this service?'}
                  </Label>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          reviewRating >= star
                            ? 'bg-yellow-400 border-yellow-400 text-white'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`h-6 w-6 mx-auto ${reviewRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reviewComment">
                    {language === 'ar' ? 'تعليقك (اختياري)' : 'Your Comment (Optional)'}
                  </Label>
                  <Textarea
                    id="reviewComment"
                    placeholder={language === 'ar' ? 'شاركنا المزيد من التفاصيل...' : 'Share more details...'}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    className="flex-1"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={submitReview}
                    disabled={reviewRating < 1 || submittingReview}
                    className="flex-1"
                  >
                    {submittingReview ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      language === 'ar' ? 'إرسال التقييم' : 'Submit Review'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </>
  );
}
