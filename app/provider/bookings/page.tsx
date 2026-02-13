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
  Calendar, 
  Search, 
  MoreVertical,
  CheckSquare,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  DollarSign,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  status: string;
  scheduled_at: string;
  completed_at: string | null;
  total_price: number;
  location: string | null;
  notes: string | null;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  service_name: string;
  service_name_ar: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProviderBookingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, pagination.page, filterStatus]);

  useEffect(() => {
    filterBookingsList();
  }, [bookings, searchQuery]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const data = await api.get<{ bookings: Booking[], pagination: PaginationInfo }>(
        `/provider/bookings?${params.toString()}`
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

  const filterBookingsList = () => {
    let filtered = [...bookings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customer_first_name.toLowerCase().includes(query) ||
          booking.customer_last_name.toLowerCase().includes(query) ||
          booking.customer_email.toLowerCase().includes(query) ||
          booking.customer_phone.includes(query) ||
          booking.service_name.toLowerCase().includes(query) ||
          booking.service_name_ar.includes(query)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleUpdateStatus = async () => {
    if (!currentBooking || !newStatus) return;
    
    try {
      setActionLoading(true);
      await api.put(`/provider/bookings/${currentBooking.id}`, {
        status: newStatus
      });
      
      setMessage({ 
        type: 'success', 
        text: language === 'ar' ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully' 
      });
      setShowStatusDialog(false);
      setCurrentBooking(null);
      setNewStatus('');
      await loadBookings();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || (language === 'ar' ? 'فشل تحديث حالة الحجز' : 'Failed to update booking status') 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusDialog = (booking: Booking) => {
    setCurrentBooking(booking);
    setNewStatus(booking.status);
    setShowStatusDialog(true);
  };

  const openDetailsDialog = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowDetailsDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBookings(newSelected);
  };

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: { 
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending', 
        variant: 'secondary',
        icon: Clock,
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      confirmed: { 
        label: language === 'ar' ? 'مؤكد' : 'Confirmed', 
        variant: 'default',
        icon: CheckCircle,
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      in_progress: { 
        label: language === 'ar' ? 'جاري التنفيذ' : 'In Progress', 
        variant: 'outline',
        icon: PlayCircle,
        color: 'bg-purple-50 text-purple-700 border-purple-200'
      },
      completed: { 
        label: language === 'ar' ? 'مكتمل' : 'Completed', 
        variant: 'outline',
        icon: CheckCircle,
        color: 'bg-green-50 text-green-700 border-green-200'
      },
      cancelled: { 
        label: language === 'ar' ? 'ملغي' : 'Cancelled', 
        variant: 'outline',
        icon: XCircle,
        color: 'bg-red-50 text-red-700 border-red-200'
      },
      refunded: { 
        label: language === 'ar' ? 'مسترد' : 'Refunded', 
        variant: 'outline',
        icon: RefreshCw,
        color: 'bg-gray-50 text-gray-700 border-gray-200'
      }
    };
    return statuses[status] || { 
      label: status, 
      variant: 'secondary',
      icon: Clock,
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    };
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم، البريد، الهاتف أو الخدمة...' : 'Search by name, email, phone or service...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                  <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                  <SelectItem value="in_progress">{language === 'ar' ? 'جاري التنفيذ' : 'In Progress'}</SelectItem>
                  <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                  <SelectItem value="refunded">{language === 'ar' ? 'مسترد' : 'Refunded'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedBookings.size > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBookings(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? `إلغاء التحديد (${selectedBookings.size})` : `Clear Selection (${selectedBookings.size})`}
                </Button>
              </div>
            )}
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد حجوزات حتى الآن' : 'No bookings yet'}
                </p>
              </Card>
            ) : (
              <>
                {filteredBookings.length > 1 && (
                  <div className="flex items-center gap-2 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedBookings.size === filteredBookings.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {filteredBookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={() => toggleSelect(booking.id)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-lg font-semibold">
                                  {language === 'ar' ? booking.service_name_ar : booking.service_name}
                                </h3>
                                <Badge variant="outline" className={statusInfo.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {booking.customer_first_name} {booking.customer_last_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span>{formatDate(booking.scheduled_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{booking.customer_email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-semibold text-primary">
                                    {formatPrice(booking.total_price)}
                                  </span>
                                </div>
                              </div>

                              {booking.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span>{booking.location}</span>
                                </div>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetailsDialog(booking)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openStatusDialog(booking)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {language === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Status Update Dialog */}
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تحديث حالة الحجز' : 'Update Booking Status'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'اختر الحالة الجديدة للحجز' 
                    : 'Select the new status for this booking'}
                </DialogDescription>
              </DialogHeader>

              {currentBooking && (
                <div className="py-4">
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <p className="font-medium">
                      {language === 'ar' ? currentBooking.service_name_ar : currentBooking.service_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentBooking.customer_first_name} {currentBooking.customer_last_name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                        <SelectItem value="in_progress">{language === 'ar' ? 'جاري التنفيذ' : 'In Progress'}</SelectItem>
                        <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                        <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleUpdateStatus} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تحديث' : 'Update'}
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
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'الخدمة' : 'Service'}
                      </label>
                      <p className="font-medium">
                        {language === 'ar' ? currentBooking.service_name_ar : currentBooking.service_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </label>
                      <div className="mt-1">
                        <Badge variant="outline" className={getStatusBadge(currentBooking.status).color}>
                          {getStatusBadge(currentBooking.status).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">{language === 'ar' ? 'معلومات العميل' : 'Customer Information'}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {language === 'ar' ? 'الاسم' : 'Name'}
                        </label>
                        <p>{currentBooking.customer_first_name} {currentBooking.customer_last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <p className="truncate">{currentBooking.customer_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {language === 'ar' ? 'الهاتف' : 'Phone'}
                        </label>
                        <p dir="ltr">{currentBooking.customer_phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">{language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {language === 'ar' ? 'الموعد المحدد' : 'Scheduled At'}
                        </label>
                        <p>{formatDate(currentBooking.scheduled_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}
                        </label>
                        <p className="font-semibold text-primary">
                          {formatPrice(currentBooking.total_price)}
                        </p>
                      </div>
                      {currentBooking.location && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            {language === 'ar' ? 'الموقع' : 'Location'}
                          </label>
                          <p>{currentBooking.location}</p>
                        </div>
                      )}
                      {currentBooking.notes && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            {language === 'ar' ? 'ملاحظات' : 'Notes'}
                          </label>
                          <p className="text-sm">{currentBooking.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'اغلاق' : 'Close'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProviderLayout>
  );
}