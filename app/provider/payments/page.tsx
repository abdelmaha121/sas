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
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
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
  FileText,
  RefreshCw
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

interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  payment_gateway_reference: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  scheduled_at: string;
  booking_status: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  service_name: string;
  service_name_ar: string;
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  thisMonth: number;
}

export default function ProviderPaymentsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    thisMonth: 0
  });

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, currentPage, filterStatus]);

  useEffect(() => {
    calculateStats();
  }, [payments]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const data = await api.get<{ payments: Payment[], pagination: any }>(
        `/provider/payments?${params.toString()}`
      );
      
      setPayments(data.payments);
      setTotalPages(data.pagination.totalPages);
      setTotalPayments(data.pagination.total);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل تحميل قائمة المدفوعات' : 'Failed to load payments' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = payments
      .filter(p => {
        if (p.status !== 'completed') return false;
        const date = new Date(p.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    setStats({ total, completed, pending, failed, thisMonth });
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.customer_first_name.toLowerCase().includes(query) ||
      payment.customer_last_name.toLowerCase().includes(query) ||
      payment.customer_email.toLowerCase().includes(query) ||
      payment.service_name.toLowerCase().includes(query) ||
      payment.service_name_ar.includes(query) ||
      payment.id.toLowerCase().includes(query) ||
      payment.payment_method.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: { 
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending', 
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
      failed: { 
        label: language === 'ar' ? 'فشل' : 'Failed', 
        variant: 'destructive',
        icon: XCircle,
        color: 'bg-red-50 text-red-700 border-red-200'
      },
      refunded: { 
        label: language === 'ar' ? 'مسترد' : 'Refunded', 
        variant: 'outline',
        icon: RefreshCw,
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      }
    };
    return statuses[status] || { label: status, variant: 'secondary', icon: AlertCircle, color: '' };
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: any = {
      credit_card: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      debit_card: language === 'ar' ? 'بطاقة خصم' : 'Debit Card',
      cash: language === 'ar' ? 'نقداً' : 'Cash',
      bank_transfer: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
      wallet: language === 'ar' ? 'محفظة إلكترونية' : 'Wallet'
    };
    return methods[method] || method;
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

  const openDetailsDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Customer', 'Service', 'Amount', 'Method', 'Status', 'Date'].join(','),
      ...filteredPayments.map(p => [
        p.id,
        `${p.customer_first_name} ${p.customer_last_name}`,
        language === 'ar' ? p.service_name_ar : p.service_name,
        p.amount,
        p.payment_method,
        p.status,
        new Date(p.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && payments.length === 0) {
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
              <CreditCard className="w-8 h-8" />
              {language === 'ar' ? 'المدفوعات' : 'Payments'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? `إجمالي المدفوعات: ${totalPayments}` 
                : `Total Payments: ${totalPayments}`}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}
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
                    {language === 'ar' ? 'مكتملة' : 'Completed'}
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
                    placeholder={language === 'ar' ? 'بحث بالاسم، الخدمة، طريقة الدفع...' : 'Search by name, service, payment method...'}
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
                    <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                    <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                    <SelectItem value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</SelectItem>
                    <SelectItem value="refunded">{language === 'ar' ? 'مسترد' : 'Refunded'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={exportData} title={language === 'ar' ? 'تصدير' : 'Export'}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Payments List */}
          <div className="space-y-4 mb-6">
            {filteredPayments.length === 0 ? (
              <Card className="p-8 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد مدفوعات حتى الآن' : 'No payments yet'}
                </p>
              </Card>
            ) : (
              filteredPayments.map((payment) => {
                const statusInfo = getStatusBadge(payment.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">
                            {payment.customer_first_name} {payment.customer_last_name}
                          </h3>
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span>{language === 'ar' ? payment.service_name_ar : payment.service_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(payment.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                            </span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(parseFloat(payment.amount.toString()))}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsDialog(payment)}
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

          {/* Payment Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'معلومات تفصيلية عن عملية الدفع' : 'Detailed payment information'}
                </DialogDescription>
              </DialogHeader>

              {selectedPayment && (
                <div className="space-y-6 py-4">
                  {/* Status & Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">{language === 'ar' ? 'الحالة' : 'Status'}</h4>
                      <Badge variant="outline" className={getStatusBadge(selectedPayment.status).color}>
                        {React.createElement(getStatusBadge(selectedPayment.status).icon, { className: "w-3 h-3 mr-1" })}
                        {getStatusBadge(selectedPayment.status).label}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{language === 'ar' ? 'المبلغ' : 'Amount'}</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(parseFloat(selectedPayment.amount.toString()))}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {selectedPayment.customer_first_name} {selectedPayment.customer_last_name}</p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedPayment.customer_email}
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
                      <p><strong>{language === 'ar' ? 'الخدمة:' : 'Service:'}</strong> {language === 'ar' ? selectedPayment.service_name_ar : selectedPayment.service_name}</p>
                      <p><strong>{language === 'ar' ? 'تاريخ الحجز:' : 'Booking Date:'}</strong> {formatDate(selectedPayment.scheduled_at)}</p>
                      <p><strong>{language === 'ar' ? 'حالة الحجز:' : 'Booking Status:'}</strong> {selectedPayment.booking_status}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                        <span className="font-medium">{getPaymentMethodLabel(selectedPayment.payment_method)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'العملة:' : 'Currency:'}</span>
                        <span className="font-medium">{selectedPayment.currency}</span>
                      </div>
                      {selectedPayment.payment_gateway_reference && (
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'رقم المرجع:' : 'Reference:'}</span>
                          <span className="font-mono text-sm">{selectedPayment.payment_gateway_reference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {language === 'ar' ? 'التواريخ' : 'Dates'}
                    </h4>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</strong> {formatDate(selectedPayment.created_at)}</p>
                      <p><strong>{language === 'ar' ? 'آخر تحديث:' : 'Updated:'}</strong> {formatDate(selectedPayment.updated_at)}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedPayment.metadata && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
                      </h4>
                      <div className="bg-muted p-4 rounded-md">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(selectedPayment.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* IDs */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{language === 'ar' ? 'رقم الدفع:' : 'Payment ID:'} {selectedPayment.id}</p>
                    <p>{language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} {selectedPayment.booking_id}</p>
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