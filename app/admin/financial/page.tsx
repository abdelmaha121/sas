'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Eye,
  RefreshCw
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
  Cell,
  Pie
} from 'recharts';

interface FinancialStats {
  totalRevenue: number;
  totalEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalBookings: number;
  completedBookings: number;
  monthlyRevenue: number;
  monthlyEarnings: number;
}

interface Payment {
  payment_method: string;
  id: string;
  amount: number;
  status: string;
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
  completed_at: string;
  service_name: string;
  service_name_ar: string;
}

export default function AdminFinancialPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalBookings: 0,
    completedBookings: 0,
    monthlyRevenue: 0,
    monthlyEarnings: 0
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [earningsChartData, setEarningsChartData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Load payments data
      const paymentsResponse = await api.get('/admin/payments?limit=100') as { payments?: Payment[] };
      const payments = paymentsResponse.payments || [];

      // Load bookings data for earnings
      const bookingsResponse = await api.get('/admin/bookings?limit=100') as { bookings?: Booking[] };
      const bookings = bookingsResponse.bookings || [];

      // Calculate stats
      const totalRevenue = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const completedPayments = payments.filter(p => p.status === 'paid').length;
      const failedPayments = payments.filter(p => p.status === 'failed').length;

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;

      // Monthly calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyRevenue = payments
        .filter(p => {
          if (p.status !== 'paid') return false;
          const date = new Date(p.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const monthlyEarnings = bookings
        .filter(b => {
          if (b.status !== 'completed' || !b.completed_at) return false;
          const date = new Date(b.completed_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      setStats({
        totalRevenue,
        totalEarnings,
        pendingPayments,
        completedPayments,
        failedPayments,
        totalBookings,
        completedBookings,
        monthlyRevenue,
        monthlyEarnings
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
    // Revenue chart data (last 6 months)
    const revenueData = [];
    const earningsData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });

      const monthRevenue = payments
        .filter(p => {
          if (p.status !== 'paid') return false;
          const pDate = new Date(p.created_at);
          return pDate.getMonth() === month && pDate.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const monthEarnings = bookings
        .filter(b => {
          if (b.status !== 'completed' || !b.completed_at) return false;
          const bDate = new Date(b.completed_at);
          return bDate.getMonth() === month && bDate.getFullYear() === year;
        })
        .reduce((sum, b) => sum + (b.provider_earnings || 0), 0);

      revenueData.push({
        month: monthName,
        revenue: monthRevenue
      });

      earningsData.push({
        month: monthName,
        earnings: monthEarnings
      });
    }

    setRevenueChartData(revenueData);
    setEarningsChartData(earningsData);

    // Payment method distribution
    const methodCounts: { [key: string]: number } = {};
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', variant: 'default' },
      pending: { label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
      failed: { label: language === 'ar' ? 'فشل' : 'Failed', variant: 'destructive' },
      completed: { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
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
                <BarChart3 className="w-8 h-8" />
                {language === 'ar' ? 'الإدارة المالية' : 'Financial Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'نظرة شاملة على الإيرادات والأرباح' : 'Comprehensive view of revenue and earnings'}
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
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
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
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-yellow-500" />
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
                  <Users className="h-6 w-6 text-purple-500" />
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
                {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name={language === 'ar' ? 'الإيرادات' : 'Revenue'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

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
            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payments">
                  {language === 'ar' ? 'المدفوعات الأخيرة' : 'Recent Payments'}
                </TabsTrigger>
                <TabsTrigger value="bookings">
                  {language === 'ar' ? 'الحجوزات الأخيرة' : 'Recent Bookings'}
                </TabsTrigger>
              </TabsList>

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
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          <Badge variant={getStatusBadge(payment.status).variant as any}>
                            {getStatusBadge(payment.status).label}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="mt-4">
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {language === 'ar' ? 'لا توجد حجوزات حديثة' : 'No recent bookings'}
                    </p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {language === 'ar' ? booking.service_name_ar : booking.service_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' ? 'حجز رقم' : 'Booking'} #{booking.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(booking.provider_earnings || 0)}
                          </p>
                          <Badge variant={getStatusBadge(booking.status).variant as any}>
                            {getStatusBadge(booking.status).label}
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
    </AdminLayout>
  );
}
