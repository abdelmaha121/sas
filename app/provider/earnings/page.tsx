'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Package,
  MapPin
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import React from 'react';

interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  provider_id: string;
  status: string;
  scheduled_at: string;
  completed_at: string | null;
  service_price: number;
  platform_fee: number;
  provider_earnings: number;
  notes: string | null;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  service_name: string;
  service_name_ar: string;
  created_at: string;
}

interface EarningsStats {
  total: number;
  completed: number;
  pending: number;
  thisMonth: number;
}

export default function ProviderEarningsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [stats, setStats] = useState<EarningsStats>({
    total: 0,
    completed: 0,
    pending: 0,
    thisMonth: 0
  });

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, currentPage, filterStatus]);

  useEffect(() => {
    calculateStats();
  }, [bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const data = await api.get<{ bookings: Booking[], pagination: any }>(
        `/provider/earnings?${params.toString()}`
      );
      
      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setTotalBookings(data.pagination.total);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load earnings:', error);
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل تحميل قائمة الأرباح' : 'Failed to load earnings' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = bookings
      .filter(b => {
        if (b.status !== 'completed' || !b.completed_at) return false;
        const date = new Date(b.completed_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

    setStats({ total, completed, pending, thisMonth });
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.customer_first_name.toLowerCase().includes(query) ||
      booking.customer_last_name.toLowerCase().includes(query) ||
      booking.customer_email.toLowerCase().includes(query) ||
      booking.service_name.toLowerCase().includes(query) ||
      booking.service_name_ar.includes(query) ||
      booking.id.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      confirmed: { 
        label: language === 'ar' ? 'مؤكد' : 'Confirmed', 
        variant: 'default',
        icon: CheckCircle,
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      in_progress: { 
        label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', 
        variant: 'secondary',
        icon: Clock,
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      completed: { 
        label: language === 'ar' ? 'مكتمل' : 'Completed', 
        variant: 'outline',
        icon: CheckCircle,
        color: 'bg-green-50 text-green-700 border-green-200'
      },
      cancelled: { 
        label: language === 'ar' ? 'ملغي' : 'Cancelled', 
        variant: 'destructive',
        icon: XCircle,
        color: 'bg-red-50 text-red-700 border-red-200'
      }
    };
    return statuses[status] || { label: status, variant: 'secondary', icon: AlertCircle, color: '' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const openDetailsDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Customer', 'Service', 'Status', 'Date', 'Earnings'].join(','),
      ...filteredBookings.map(b => [
        b.id,
        `${b.customer_first_name} ${b.customer_last_name}`,
        language === 'ar' ? b.service_name_ar : b.service_name,
        b.status,
        new Date(b.scheduled_at).toLocaleDateString(),
        b.provider_earnings || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && bookings.length === 0) {
    return (
      <ProviderLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <DollarSign className="w-8 h-8" />
              {language === 'ar' ? 'الأرباح والحجوزات' : 'Earnings & Bookings'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? `إجمالي الحجوزات: ${totalBookings}` 
                : `Total Bookings: ${totalBookings}`}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'هذا الشهر' : 'This Month'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'حجوزات مكتملة' : 'Completed'}
                  </p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                  </p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم، الخدمة أو رقم الحجز...' : 'Search by name, service or booking ID...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                    <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                    <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                    <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                    <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={exportData} title={language === 'ar' ? 'تصدير' : 'Export'}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4 mb-6">
            {filteredBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد حجوزات حتى الآن' : 'No bookings yet'}
                </p>
              </Card>
            ) : (
              filteredBookings.map((booking) => {
                const statusInfo = getStatusBadge(booking.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">
                            {booking.customer_first_name} {booking.customer_last_name}
                          </h3>
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span>{language === 'ar' ? booking.service_name_ar : booking.service_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(booking.scheduled_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              {language === 'ar' ? 'سعر الخدمة:' : 'Service Price:'}
                            </span>
                            <span className="font-medium">{formatCurrency(booking.service_price)}</span>
                          </div>
                          {booking.status === 'completed' && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {language === 'ar' ? 'أرباحك:' : 'Your Earnings:'}
                              </span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(booking.provider_earnings || 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsDialog(booking)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'التفاصيل' : 'Details'}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? `صفحة ${currentPage} من ${totalPages}`
                    : `Page ${currentPage} of ${totalPages}`}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </Card>
          )}

          {/* Booking Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'معلومات تفصيلية عن الحجز' : 'Detailed booking information'}
                </DialogDescription>
              </DialogHeader>

              {selectedBooking && (
                <div className="space-y-6 py-4">
                  {/* Status */}
                  <div>
                    <h4 className="font-medium mb-2">{language === 'ar' ? 'الحالة' : 'Status'}</h4>
                    <Badge variant="outline" className={getStatusBadge(selectedBooking.status).color}>
                      {React.createElement(getStatusBadge(selectedBooking.status).icon, { className: "w-3 h-3 mr-1" })}
                      {getStatusBadge(selectedBooking.status).label}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {selectedBooking.customer_first_name} {selectedBooking.customer_last_name}</p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedBooking.customer_email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{selectedBooking.customer_phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات الخدمة' : 'Service Information'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>{language === 'ar' ? 'الخدمة:' : 'Service:'}</strong> {language === 'ar' ? selectedBooking.service_name_ar : selectedBooking.service_name}</p>
                      <p><strong>{language === 'ar' ? 'السعر:' : 'Price:'}</strong> {formatCurrency(selectedBooking.service_price)}</p>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {language === 'ar' ? 'التفاصيل المالية' : 'Financial Details'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'سعر الخدمة:' : 'Service Price:'}</span>
                        <span className="font-medium">{formatCurrency(selectedBooking.service_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'رسوم المنصة:' : 'Platform Fee:'}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(selectedBooking.platform_fee || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold">{language === 'ar' ? 'أرباحك:' : 'Your Earnings:'}</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedBooking.provider_earnings || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {language === 'ar' ? 'التواريخ' : 'Dates'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>{language === 'ar' ? 'موعد الحجز:' : 'Scheduled:'}</strong> {formatDate(selectedBooking.scheduled_at)}</p>
                      {selectedBooking.completed_at && (
                        <p><strong>{language === 'ar' ? 'تاريخ الإكمال:' : 'Completed:'}</strong> {formatDate(selectedBooking.completed_at)}</p>
                      )}
                      <p><strong>{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</strong> {formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedBooking.notes && (
                    <div>
                      <h4 className="font-medium mb-2">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm">{selectedBooking.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Booking ID */}
                  <div className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} {selectedBooking.id}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProviderLayout>
  );
}