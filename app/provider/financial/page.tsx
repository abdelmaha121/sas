'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface FinancialStats {
  totalEarnings: number;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalBookings: number;
  completedBookings: number;
  monthlyEarnings: number;
  monthlyPayments: number;
}

interface Payment {
  id: string;
  amount: number | string;
  status: string;
  payment_method: string;
  created_at: string;
  customer_first_name: string;
  customer_last_name: string;
  service_name: string;
  service_name_ar: string;
}

interface Booking {
  id: string;
  provider_earnings: number;
  status: string;
  completed_at: string | null;
  service_name: string;
  service_name_ar: string;
  customer_first_name: string;
  customer_last_name: string;
}

interface ChartDataPoint {
  month: string;
  earnings?: number;
  payments?: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusBadgeConfig {
  label: string;
  variant: BadgeVariant;
}

export default function ProviderFinancialPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalEarnings: 0,
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalBookings: 0,
    completedBookings: 0,
    monthlyEarnings: 0,
    monthlyPayments: 0
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [earningsChartData, setEarningsChartData] = useState<ChartDataPoint[]>([]);
  const [paymentsChartData, setPaymentsChartData] = useState<ChartDataPoint[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);

  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Load payments data
      const paymentsResponse = await api.get('/provider/payments?limit=100');
      const payments: Payment[] = (paymentsResponse as { payments?: Payment[] })?.payments || [];

      // Load bookings data for earnings
      const bookingsResponse = await api.get('/provider/earnings?limit=100');
      const bookings: Booking[] = (bookingsResponse as { bookings?: Booking[] })?.bookings || [];

      // Calculate stats
      const totalPayments = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const completedPayments = payments.filter(p => p.status === 'completed').length;
      const failedPayments = payments.filter(p => p.status === 'failed').length;

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;

      // Monthly calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyPayments = payments
        .filter(p => {
          if (p.status !== 'completed') return false;
          const date = new Date(p.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      const monthlyEarnings = bookings
        .filter(b => {
          if (b.status !== 'completed' || !b.completed_at) return false;
          const date = new Date(b.completed_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      setStats({
        totalEarnings,
        totalPayments,
        pendingPayments,
        completedPayments,
        failedPayments,
        totalBookings,
        completedBookings,
        monthlyEarnings,
        monthlyPayments
      });

      // Set recent data
      setRecentPayments(payments.slice(0, 5));
      setRecentBookings(bookings.slice(0, 5));

      // Generate chart data
      generateChartData(payments, bookings);

    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (payments: Payment[], bookings: Booking[]) => {
    // Earnings and payments chart data (last 6 months)
    const earningsData: ChartDataPoint[] = [];
    const paymentsData: ChartDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });

      const monthEarnings = bookings
        .filter(b => {
          if (b.status !== 'completed' || !b.completed_at) return false;
          const bDate = new Date(b.completed_at);
          return bDate.getMonth() === month && bDate.getFullYear() === year;
        })
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      const monthPayments = payments
        .filter(p => {
          if (p.status !== 'completed') return false;
          const pDate = new Date(p.created_at);
          return pDate.getMonth() === month && pDate.getFullYear() === year;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      earningsData.push({
        month: monthName,
        earnings: monthEarnings
      });

      paymentsData.push({
        month: monthName,
        payments: monthPayments
      });
    }

    setEarningsChartData(earningsData);
    setPaymentsChartData(paymentsData);

    // Payment method distribution
    const methodCounts: Record<string, number> = {};
    payments.forEach(payment => {
      const method = payment.payment_method || 'unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    const methodData = Object.entries(methodCounts).map(([method, count]) => ({
      name: method,
      value: count
    }));

    setPaymentMethodData(methodData);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const getStatusBadge = (status: string): StatusBadgeConfig => {
    const variants: Record<string, StatusBadgeConfig> = {
      completed: { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' },
      pending: { label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
      failed: { label: language === 'ar' ? 'فشل' : 'Failed', variant: 'destructive' },
      paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', variant: 'default' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const getPaymentMethodLabel = (method: string): string => {
    const methods: Record<string, string> = {
      credit_card: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      debit_card: language === 'ar' ? 'بطاقة خصم' : 'Debit Card',
      cash: language === 'ar' ? 'نقداً' : 'Cash',
      bank_transfer: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
      wallet: language === 'ar' ? 'محفظة إلكترونية' : 'Wallet'
    };
    return methods[method] || method;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
                <BarChart3 className="w-8 h-8" />
                {language === 'ar' ? 'الإدارة المالية' : 'Financial Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'نظرة شاملة على أرباحك ومدفوعاتك' : 'Comprehensive view of your earnings and payments'}
              </p>
            </div>
            <Button onClick={loadFinancialData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}
                  </p>
                  <h3 className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}
                  </p>
                  <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPayments)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'مدفوعات معلقة' : 'Pending Payments'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats.pendingPayments}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'حجوزات مكتملة' : 'Completed Bookings'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats.completedBookings}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'ar' ? 'الأرباح الشهرية' : 'Monthly Earnings'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar
                    dataKey="earnings"
                    fill="#00C49F"
                    name={language === 'ar' ? 'الأرباح' : 'Earnings'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'ar' ? 'المدفوعات الشهرية' : 'Monthly Payments'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="payments"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name={language === 'ar' ? 'المدفوعات' : 'Payments'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Payment Methods Chart */}
          {paymentMethodData.length > 0 && (
            <Card className="p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'ar' ? 'توزيع طرق الدفع' : 'Payment Methods Distribution'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Recent Activity Tabs */}
          <Card className="p-4">
            <Tabs defaultValue="earnings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="earnings">
                  {language === 'ar' ? 'الأرباح الأخيرة' : 'Recent Earnings'}
                </TabsTrigger>
                <TabsTrigger value="payments">
                  {language === 'ar' ? 'المدفوعات الأخيرة' : 'Recent Payments'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="earnings" className="mt-4">
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد أرباح حديثة' : 'No recent earnings'}
                    </p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {booking.customer_first_name} {booking.customer_last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' ? booking.service_name_ar : booking.service_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(booking.provider_earnings || 0)}
                          </p>
                          <Badge variant={getStatusBadge(booking.status).variant}>
                            {getStatusBadge(booking.status).label}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <div className="space-y-4">
                  {recentPayments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد مدفوعات حديثة' : 'No recent payments'}
                    </p>
                  ) : (
                    recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {payment.customer_first_name} {payment.customer_last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' ? payment.service_name_ar : payment.service_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(parseFloat(payment.amount.toString()))}</p>
                          <Badge variant={getStatusBadge(payment.status).variant}>
                            {getStatusBadge(payment.status).label}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}
