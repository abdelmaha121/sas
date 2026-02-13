'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CreateReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const { user } = useAuth();
  const { language } = useLanguage();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId && user) {
      loadBooking();
    }
  }, [bookingId, user]);

  const loadBooking = async () => {
    try {
      const data = await api.get<{ booking: any }>(`/bookings/${bookingId}`);
      setBooking(data.booking);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setError(language === 'ar' ? 'فشل تحميل بيانات الحجز' : 'Failed to load booking');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError(language === 'ar' ? 'الرجاء اختيار التقييم' : 'Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError(language === 'ar' ? 'الرجاء كتابة تعليق' : 'Please write a comment');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post('/reviews', {
        bookingId,
        rating,
        comment,
      });

      alert(language === 'ar' ? 'تم إرسال التقييم بنجاح!' : 'Review submitted successfully!');
      router.push('/customer/bookings/history');
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل إرسال التقييم' : 'Failed to submit review'));
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'خطأ' : 'Error'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'معرف الحجز مفقود' : 'Booking ID is missing'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Header />
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">
          {language === 'ar' ? 'تقييم الخدمة' : 'Rate Service'}
        </h1>

        {booking && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-2">
              {language === 'ar' ? booking.service_name_ar : booking.service_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'مقدم الخدمة: ' : 'Provider: '}
              {language === 'ar' ? booking.provider_name_ar : booking.provider_name}
            </p>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded">
                {error}
              </div>
            )}

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                {language === 'ar' ? 'التقييم' : 'Rating'}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' ? `${rating} من 5` : `${rating} out of 5`}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'التعليق' : 'Comment'}
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'شارك تجربتك مع الخدمة...'
                    : 'Share your experience with the service...'
                }
                rows={5}
                required
              />
            </div>

            {/* Media Upload (Coming Soon) */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الصور (اختياري)' : 'Photos (Optional)'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رفع الصور - قريباً' : 'Upload Photos - Coming Soon'}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={loading}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? language === 'ar'
                    ? 'جاري الإرسال...'
                    : 'Submitting...'
                  : language === 'ar'
                  ? 'إرسال التقييم'
                  : 'Submit Review'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
       <Footer />
    </div>
  );
}
