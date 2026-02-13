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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Search, CreditCard, Eye, Download, FileText, FileSpreadsheet, Calendar, User, Building } from 'lucide-react';

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string;
  service_name?: string;
  service_name_ar?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  provider_name?: string;
  provider_name_ar?: string;
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) loadPayments();
  }, [user, includeInactive]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (includeInactive) params.append('include_inactive', 'true');
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPaymentMethod !== 'all') params.append('payment_method', filterPaymentMethod);
      const queryString = params.toString();
      const url = `/admin/payments${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<{ payments: Payment[]; pagination: any }>(url);
      setPayments(data.payments);
      setMessage(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل تحميل قائمة المدفوعات' : 'Failed to load payments list' });
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = (payment: Payment) => {
    setCurrentPayment(payment);
    setShowViewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
      paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', variant: 'default' },
      failed: { label: language === 'ar' ? 'فشل' : 'Failed', variant: 'destructive' },
      refunded: { label: language === 'ar' ? 'مسترجع' : 'Refunded', variant: 'outline' },
      cancelled: { label: language === 'ar' ? 'ملغي' : 'Cancelled', variant: 'outline' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchQuery === '' ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${payment.customer_first_name} ${payment.customer_last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || payment.payment_method === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const { utils, writeFile } = await import('xlsx');

      const exportData = filteredPayments.map(payment => ({
        [language === 'ar' ? 'رقم المعاملة' : 'Transaction ID']: payment.transaction_id || payment.id.slice(0, 8),
        [language === 'ar' ? 'رقم الحجز' : 'Booking ID']: payment.booking_id,
        [language === 'ar' ? 'الخدمة' : 'Service']: language === 'ar' && payment.service_name_ar ? payment.service_name_ar : payment.service_name,
        [language === 'ar' ? 'العميل' : 'Customer']: `${payment.customer_first_name || ''} ${payment.customer_last_name || ''}`.trim() || '-',
        [language === 'ar' ? 'البريد الإلكتروني' : 'Email']: payment.customer_email || '-',
        [language === 'ar' ? 'المزود' : 'Provider']: language === 'ar' && payment.provider_name_ar ? payment.provider_name_ar : payment.provider_name,
        [language === 'ar' ? 'المبلغ' : 'Amount']: payment.amount,
        [language === 'ar' ? 'العملة' : 'Currency']: payment.currency,
        [language === 'ar' ? 'طريقة الدفع' : 'Payment Method']: payment.payment_method || '-',
        [language === 'ar' ? 'الحالة' : 'Status']: getStatusBadge(payment.status).label,
        [language === 'ar' ? 'تاريخ الموعد' : 'Scheduled Date']: payment.scheduled_at ? new Date(payment.scheduled_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-',
        [language === 'ar' ? 'تاريخ الإنشاء' : 'Created At']: new Date(payment.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'),
        [language === 'ar' ? 'آخر تحديث' : 'Updated At']: new Date(payment.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'),
        [language === 'ar' ? 'الملاحظات' : 'Notes']: payment.notes || '-'
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, language === 'ar' ? 'المدفوعات' : 'Payments');
      writeFile(wb, `payments_${new Date().toISOString().split('T')[0]}.xlsx`);

      setMessage({ type: 'success', text: language === 'ar' ? 'تم تصدير البيانات إلى Excel بنجاح' : 'Data exported to Excel successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data' });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToJSON = () => {
    try {
      setExportLoading(true);
      const exportData = filteredPayments.map(payment => ({
        id: payment.id,
        booking_id: payment.booking_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        notes: payment.notes,
        scheduled_at: payment.scheduled_at,
        service_name: payment.service_name,
        service_name_ar: payment.service_name_ar,
        customer_name: `${payment.customer_first_name || ''} ${payment.customer_last_name || ''}`.trim(),
        customer_email: payment.customer_email,
        provider_name: payment.provider_name,
        provider_name_ar: payment.provider_name_ar,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }));

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `payments_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setMessage({ type: 'success', text: language === 'ar' ? 'تم تصدير البيانات إلى JSON بنجاح' : 'Data exported to JSON successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data' });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExportLoading(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(language === 'ar' ? 'تقرير المدفوعات' : 'Payments Report', 20, 20);

      // Add date
      doc.setFontSize(12);
      doc.text(`${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}`, 20, 35);

      // Add summary
      doc.text(`${language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}: ${filteredPayments.length}`, 20, 50);
      doc.text(`${language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}: ${totalRevenue.toFixed(2)} SAR`, 20, 60);

      let yPosition = 80;

      // Add table headers
      doc.setFontSize(10);
      const headers = [
        language === 'ar' ? 'رقم المعاملة' : 'Transaction ID',
        language === 'ar' ? 'العميل' : 'Customer',
        language === 'ar' ? 'المبلغ' : 'Amount',
        language === 'ar' ? 'الحالة' : 'Status'
      ];

      headers.forEach((header, index) => {
        doc.text(header, 20 + (index * 40), yPosition);
      });

      yPosition += 10;

      // Add table data
      filteredPayments.slice(0, 20).forEach((payment, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const rowData = [
          payment.transaction_id?.slice(0, 8) || payment.id.slice(0, 8),
          `${payment.customer_first_name || ''} ${payment.customer_last_name || ''}`.trim().slice(0, 15) || '-',
          `${payment.amount} ${payment.currency}`,
          getStatusBadge(payment.status).label
        ];

        rowData.forEach((data, dataIndex) => {
          doc.text(data, 20 + (dataIndex * 40), yPosition);
        });

        yPosition += 8;
      });

      doc.save(`payments_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setMessage({ type: 'success', text: language === 'ar' ? 'تم تصدير التقرير إلى PDF بنجاح' : 'Report exported to PDF successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: language === 'ar' ? 'فشل في تصدير التقرير' : 'Failed to export report' });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && payments.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="w-8 h-8" />
                {language === 'ar' ? 'إدارة المدفوعات' : 'Payments Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? `إجمالي المدفوعات: ${payments.length}` : `Total Payments: ${payments.length}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel} disabled={exportLoading} size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
              </Button>
              <Button variant="outline" onClick={exportToJSON} disabled={exportLoading} size="sm">
                <FileText className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير JSON' : 'Export JSON'}
              </Button>
              <Button variant="outline" onClick={exportToPDF} disabled={exportLoading} size="sm">
                <Download className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <h3 className="text-2xl font-bold">{totalRevenue.toFixed(2)} SAR</h3>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'مدفوعات معلقة' : 'Pending Payments'}
                  </p>
                  <h3 className="text-2xl font-bold">{pendingPayments}</h3>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'مدفوعات فاشلة' : 'Failed Payments'}
                  </p>
                  <h3 className="text-2xl font-bold">{failedPayments}</h3>
                </div>
              </div>
            </Card>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالعميل أو رقم المعاملة...' : 'Search by customer or transaction ID...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                  <SelectItem value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</SelectItem>
                  <SelectItem value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</SelectItem>
                  <SelectItem value="refunded">{language === 'ar' ? 'مسترجع' : 'Refunded'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'طريقة الدفع' : 'Payment Method'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الطرق' : 'All Methods'}</SelectItem>
                  <SelectItem value="card">{language === 'ar' ? 'بطاقة ائتمانية' : 'Credit Card'}</SelectItem>
                  <SelectItem value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                  <SelectItem value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</SelectItem>
                  <SelectItem value="wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'Digital Wallet'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm">{language === 'ar' ? 'إظهار المدفوعات الملغية' : 'Show cancelled payments'}</span>
              </label>
            </div>
          </Card>

          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <Card className="p-8 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterStatus !== 'all' || filterPaymentMethod !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد مدفوعات حتى الآن' : 'No payments yet'}
                </p>
              </Card>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                      <div className="flex-shrink-0 min-w-[150px]">
                        <h3 className="text-base font-semibold">{language === 'ar' && payment.service_name_ar ? payment.service_name_ar : payment.service_name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {payment.scheduled_at ? new Date(payment.scheduled_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                        </p>
                      </div>

                      <div className="flex-shrink-0 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{`${payment.customer_first_name || ''} ${payment.customer_last_name || ''}`.trim() || '-'}</p>
                            <p className="text-xs text-muted-foreground">{payment.customer_email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 min-w-[120px]">
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="w-4 h-4" />
                          {payment.amount} {payment.currency}
                        </div>
                      </div>

                      <div className="flex-shrink-0 min-w-[120px]">
                        <Badge variant={getStatusBadge(payment.status).variant as any}>
                          {getStatusBadge(payment.status).label}
                        </Badge>
                      </div>

                      <div className="flex-shrink-0 min-w-[120px]">
                        <p className="text-xs text-muted-foreground">{payment.payment_method || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 min-w-[60px] justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(payment)} className="h-9 w-9 p-0" title={language === 'ar' ? 'عرض' : 'View'}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* View Payment Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تفاصيل الدفعة' : 'Payment Details'}</DialogTitle>
              </DialogHeader>
              {currentPayment && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</label>
                      <p className="text-sm font-mono">{currentPayment.transaction_id || currentPayment.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</label>
                      <p className="text-sm font-mono">{currentPayment.booking_id}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الخدمة' : 'Service'}</label>
                    <p className="text-sm">{language === 'ar' && currentPayment.service_name_ar ? currentPayment.service_name_ar : currentPayment.service_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'العميل' : 'Customer'}</label>
                      <div className="text-sm">
                        <p className="font-medium">{`${currentPayment.customer_first_name || ''} ${currentPayment.customer_last_name || ''}`.trim() || '-'}</p>
                        <p className="text-muted-foreground">{currentPayment.customer_email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'المزود' : 'Provider'}</label>
                      <p className="text-sm">{language === 'ar' && currentPayment.provider_name_ar ? currentPayment.provider_name_ar : currentPayment.provider_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'المبلغ' : 'Amount'}</label>
                      <p className="text-sm font-semibold">{currentPayment.amount} {currentPayment.currency}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <p className="text-sm">{currentPayment.payment_method || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                      <Badge variant={getStatusBadge(currentPayment.status).variant as any}>
                        {getStatusBadge(currentPayment.status).label}
                      </Badge>
                    </div>
                  </div>

                  {currentPayment.notes && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الملاحظات' : 'Notes'}</label>
                      <p className="text-sm whitespace-pre-wrap">{currentPayment.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentPayment.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'آخر تحديث' : 'Updated At'}</label>
                      <p className="text-sm text-muted-foreground">{new Date(currentPayment.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>{language === 'ar' ? 'إغلاق' : 'Close'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}
