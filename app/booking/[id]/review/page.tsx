'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Home as HomeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();

  const bookingId = searchParams.get('booking_id');
  const providerId = searchParams.get('provider_id');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(language === 'ar' ? 'الرجاء اختيار تقييم' : 'Please select a rating');
      return;
    }

    if (!bookingId || !params.serviceId || !providerId) {
      setError(language === 'ar' ? 'معلومات الحجز غير مكتملة' : 'Booking information is incomplete');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/reviews/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || (language === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit review'));
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setError(language === 'ar' ? 'حدث خطأ في إرسال التقييم' : 'An error occurred while submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-background flex items-center justify-center p-4">
          <Card className="p-8 max-w-md text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-green-600">
              {language === 'ar' ? 'شكراً لتقييمك!' : 'Thank You for Your Review!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'ar'
                ? 'تم إرسال تقييمك بنجاح. نحن نقدر ملاحظاتك!'
                : 'Your review has been submitted successfully. We appreciate your feedback!'}
            </p>
            <Button onClick={() => router.push('/')} className="btn-primary">
              <HomeIcon className="h-4 w-4 ml-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4 border-b">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'قيّم تجربتك' : 'Rate Your Experience'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'ساعدنا في تحسين خدماتنا من خلال مشاركة رأيك'
                : 'Help us improve our services by sharing your feedback'}
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-2xl px-4 py-8">
          {error && (
            <Card className="p-4 mb-6 border-destructive bg-destructive/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
              </div>
            </Card>
          )}

          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">
                {language === 'ar' ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
              </h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && (language === 'ar' ? 'سيء جداً' : 'Very Poor')}
                  {rating === 2 && (language === 'ar' ? 'سيء' : 'Poor')}
                  {rating === 3 && (language === 'ar' ? 'مقبول' : 'Acceptable')}
                  {rating === 4 && (language === 'ar' ? 'جيد' : 'Good')}
                  {rating === 5 && (language === 'ar' ? 'ممتاز' : 'Excellent')}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 font-semibold mb-3">
                <MessageSquare className="h-5 w-5" />
                {language === 'ar' ? 'تعليقك (اختياري)' : 'Your Comment (Optional)'}
              </label>
              <Textarea
                placeholder={
                  language === 'ar'
                    ? 'شاركنا تفاصيل تجربتك...'
                    : 'Share details about your experience...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'ar'
                  ? 'تعليقك سيساعدنا في تحسين جودة خدماتنا'
                  : 'Your feedback helps us improve our service quality'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
                disabled={submitting}
              >
                {language === 'ar' ? 'تخطي' : 'Skip'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1 btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                  </>
                ) : (
                  language === 'ar' ? 'إرسال التقييم' : 'Submit Review'
                )}
              </Button>
            </div>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              {language === 'ar'
                ? 'ملاحظة: التقييم اختياري، ولكنه يساعدنا في تحسين تجربة الخدمة'
                : 'Note: Review is optional, but it helps us improve the service experience'}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
