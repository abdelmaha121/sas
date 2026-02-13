'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Package,
  Truck,
  Home
} from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface BookingStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  scheduledAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface BookingStatusTrackerProps {
  bookingId: string;
  onStatusChange?: (status: BookingStatus) => void;
  refreshInterval?: number;
}

const STATUS_CONFIGS = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200',
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200',
    labelAr: 'مؤكد',
    labelEn: 'Confirmed',
  },
  in_progress: {
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200',
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200',
    labelAr: 'مكتمل',
    labelEn: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200',
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
  },
  refunded: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200',
    labelAr: 'مسترجع',
    labelEn: 'Refunded',
  },
};

const PAYMENT_STATUS_CONFIGS = {
  pending: {
    labelAr: 'في انتظار الدفع',
    labelEn: 'Payment Pending',
    color: 'text-yellow-600',
  },
  paid: {
    labelAr: 'تم الدفع',
    labelEn: 'Paid',
    color: 'text-green-600',
  },
  failed: {
    labelAr: 'فشل الدفع',
    labelEn: 'Payment Failed',
    color: 'text-red-600',
  },
  refunded: {
    labelAr: 'مسترجع',
    labelEn: 'Refunded',
    color: 'text-orange-600',
  },
};

export default function BookingStatusTracker({
  bookingId,
  onStatusChange,
  refreshInterval = 10000,
}: BookingStatusTrackerProps) {
  const { language } = useLanguage();
  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingStatus = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch booking status');
      }

      const data = await response.json();

      if (data.success && data.booking) {
        const newStatus: BookingStatus = {
          id: data.booking.id,
          status: data.booking.status,
          paymentStatus: data.booking.payment_status,
          scheduledAt: data.booking.scheduled_at,
          completedAt: data.booking.completed_at,
          updatedAt: data.booking.updated_at,
        };

        setStatus(newStatus);

        if (onStatusChange && status?.status !== newStatus.status) {
          onStatusChange(newStatus);
        }
      }
    } catch (err) {
      console.error('Error fetching booking status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId) return;

    fetchBookingStatus();

    const interval = setInterval(fetchBookingStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [bookingId, refreshInterval]);

  if (loading && !status) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      </Card>
    );
  }

  if (!status) return null;

  const statusConfig = STATUS_CONFIGS[status.status];
  const paymentConfig = PAYMENT_STATUS_CONFIGS[status.paymentStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`p-6 border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'حالة الحجز' : 'Booking Status'}
              </h3>
              <p className={`text-sm font-medium ${statusConfig.color}`}>
                {language === 'ar' ? statusConfig.labelAr : statusConfig.labelEn}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={paymentConfig.color}>
            {language === 'ar' ? paymentConfig.labelAr : paymentConfig.labelEn}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center justify-between">
            <span>{language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'}</span>
            <span className="font-mono text-xs">{status.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{language === 'ar' ? 'موعد الخدمة:' : 'Scheduled:'}</span>
            <span>{new Date(status.scheduledAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
          </div>
          {status.completedAt && (
            <div className="flex items-center justify-between">
              <span>{language === 'ar' ? 'اكتمل في:' : 'Completed:'}</span>
              <span>{new Date(status.completedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span>{language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}</span>
            <span>{new Date(status.updatedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{language === 'ar' ? 'التحديث التلقائي كل 10 ثوانٍ' : 'Auto-refreshing every 10 seconds'}</span>
        </div>
      </div>
    </Card>
  );
}
