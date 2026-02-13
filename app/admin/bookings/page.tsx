'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Search,
  Edit,
  Mail,
  Phone,
  User,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Eye,
  Save,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  total_amount: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  provider_name: string;
  service_name: string;
  service_description?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, pagination.page, pagination.limit, searchQuery, filterStatus, filterPaymentStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPaymentStatus && filterPaymentStatus !== 'all') params.append('payment_status', filterPaymentStatus);

      const data = await api.get<{ bookings: Booking[], pagination: PaginationInfo }>(
        `/admin/bookings?${params.toString()}`
      );

      setBookings(data.bookings);
      setPagination(data.pagination);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل قائمة الحجوزات' : 'Failed to load bookings list'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = async () => {
    if (!currentBooking) return;

    try {
      setActionLoading(true);
      await api.put(`/admin/bookings/${currentBooking.id}`, {
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes
      });

      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم تحديث الحجز بنجاح' : 'Booking updated successfully'
      });
      setShowEditDialog(false);
      setCurrentBooking(null);
      resetForm();
      await loadBookings();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل تحديث الحجز' : 'Failed to update booking')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      status: '',
      paymentStatus: '',
      notes: ''
    });
  };

  const openEditDialog = (booking: Booking) => {
    setCurrentBooking(booking);
    setFormData({
      status: booking.status,
      paymentStatus: booking.payment_status,
      notes: booking.notes || ''
    });
    setShowEditDialog(true);
  };

  const openDetailsDialog = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: {
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock
      },
      confirmed: {
        label: language === 'ar' ? 'مؤكد' : 'Confirmed',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle
      },
      completed: {
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle
      },
      cancelled: {
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle
      }
    };
    return statuses[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle };
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statuses: any = {
      pending: {
        label: language === 'ar' ? 'معلق' : 'Pending',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      paid: {
        label: language === 'ar' ? 'مدفوع' : 'Paid',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      failed: {
        label: language === 'ar' ? 'فشل' : 'Failed',
        className: 'bg-red-50 text-red-700 border-red-200'
      },
      refunded: {
        label: language === 'ar' ? 'مسترد' : 'Refunded',
        className: 'bg-purple-50 text-purple-700 border-purple-200'
      }
    };
    return statuses[paymentStatus] || { label: paymentStatus, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  if (loading && bookings.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                {language === 'ar' ? 'إدارة الحجوزات' : 'Bookings Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي الحجوزات: ${pagination.total}`
                  : `Total Bookings: ${pagination.total}`}
              </p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم، البريد أو مقدم الخدمة...' : 'Search by name, email or provider...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'حالة الحجز' : 'Booking Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                  <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                  <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'حالة الدفع' : 'Payment Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع حالات الدفع' : 'All Payment Status'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                  <SelectItem value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</SelectItem>
                  <SelectItem value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</SelectItem>
                  <SelectItem value="refunded">{language === 'ar' ? 'مسترد' : 'Refunded'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all' || filterPaymentStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد حجوزات حتى الآن' : 'No bookings yet'}
                </p>
              </Card>
            ) : (
              <>
                {bookings.map((booking) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const paymentBadge = getPaymentStatusBadge(booking.payment_status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-4">
                        {/* Header Section */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {booking.customer_first_name} {booking.customer_last_name}
                              </h3>
                              <Badge variant="outline" className={statusBadge.className}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusBadge.label}
                              </Badge>
                              <Badge variant="outline" className={paymentBadge.className}>
                                <DollarSign className="w-3 h-3 mr-1" />
                                {paymentBadge.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{booking.customer_email}</span>
                              </div>

                              {booking.customer_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground" dir="ltr">{booking.customer_phone}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{booking.provider_name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{booking.service_name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{formatDate(booking.booking_date)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground" dir="ltr">{formatTime(booking.booking_time)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                  {booking.total_amount} {language === 'ar' ? 'ر.ع' : 'OMR'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsDialog(booking)}
                              className="h-9"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'عرض' : 'View'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(booking)}
                              className="h-9"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'تعديل' : 'Edit'}
                            </Button>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {booking.notes && (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</span> {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `الصفحة ${pagination.page} من ${pagination.totalPages}`
                  : `Page ${pagination.page} of ${pagination.totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {/* Edit Booking Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل الحجز' : 'Edit Booking'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar'
                    ? 'قم بتحديث حالة الحجز وحالة الدفع والملاحظات'
                    : 'Update booking status, payment status and notes'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'حالة الحجز' : 'Booking Status'}
                  </label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                      <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                      <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                      <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'حالة الدفع' : 'Payment Status'}
                  </label>
                  <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                      <SelectItem value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</SelectItem>
                      <SelectItem value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</SelectItem>
                      <SelectItem value="refunded">{language === 'ar' ? 'مسترد' : 'Refunded'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل ملاحظات إضافية...' : 'Enter additional notes...'}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditBooking} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
                </DialogTitle>
              </DialogHeader>

              {currentBooking && (
                <div className="space-y-6 py-4">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
                        <p className="font-medium">{currentBooking.customer_first_name} {currentBooking.customer_last_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'البريد:' : 'Email:'}</span>
                        <p className="font-medium">{currentBooking.customer_email}</p>
                      </div>
                      {currentBooking.customer_phone && (
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                          <p className="font-medium" dir="ltr">{currentBooking.customer_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات الخدمة' : 'Service Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'مقدم الخدمة:' : 'Provider:'}</span>
                        <p className="font-medium">{currentBooking.provider_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'الخدمة:' : 'Service:'}</span>
                        <p className="font-medium">{currentBooking.service_name}</p>
                      </div>
                      {currentBooking.service_description && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{language === 'ar' ? 'الوصف:' : 'Description:'}</span>
                          <p className="font-medium">{currentBooking.service_description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Info */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات الحجز' : 'Booking Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                        <p className="font-medium">{formatDate(currentBooking.booking_date)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'الوقت:' : 'Time:'}</span>
                        <p className="font-medium" dir="ltr">{formatTime(currentBooking.booking_time)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'المبلغ:' : 'Amount:'}</span>
                        <p className="font-medium">{currentBooking.total_amount} {language === 'ar' ? 'ر.ع' : 'OMR'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                        <div className="mt-1">
                          <Badge variant="outline" className={getStatusBadge(currentBooking.status).className}>
                            {getStatusBadge(currentBooking.status).label}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'حالة الدفع:' : 'Payment:'}</span>
                        <div className="mt-1">
                          <Badge variant="outline" className={getPaymentStatusBadge(currentBooking.payment_status).className}>
                            {getPaymentStatusBadge(currentBooking.payment_status).label}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</span>
                        <p className="font-medium">{formatDate(currentBooking.created_at)}</p>
                      </div>
                      {currentBooking.completed_at && (
                        <div>
                          <span className="text-muted-foreground">{language === 'ar' ? 'تاريخ الإكمال:' : 'Completed:'}</span>
                          <p className="font-medium">{formatDate(currentBooking.completed_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {currentBooking.notes && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {language === 'ar' ? 'ملاحظات' : 'Notes'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{currentBooking.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    openEditDialog(currentBooking!);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تعديل الحجز' : 'Edit Booking'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}