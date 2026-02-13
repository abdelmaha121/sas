'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, Building2, 
  ShoppingBag, Briefcase, AlertTriangle, CheckCircle2, 
  Clock, RefreshCw, FileText, BarChart3, UserCheck,
  Calendar, MapPin, Activity, Zap, ArrowRight
} from 'lucide-react';

interface DashboardData {
  statistics: {
    users: number;
    providers: number;
    services: number;
    bookings: number;
    revenue: {
      total: number;
      commission: number;
    };
    bookingsByStatus: Record<string, number>;
    statistics: {
      kpis: {
        todayBookings: { value: number; change: number; };
        weekBookings: { value: number; change: number; };
        activeProviders: { value: number; change: number; };
        cancellationRate: { value: number; change: number; };
      };
      charts: {
        bookingsOverTime: { date: string; count: number }[];
        revenueByCategory: { category: string; revenue: number }[];
        topCities: { city: string; bookings: number }[];
      };
      alerts: {
        pendingProviders: number;
        overdueBookings: number;
        pendingRefunds: number;
        cancellationSpike: number;
      };
    };
  };
  recentBookings: {
    id: string;
    status: string;
    total_amount: number;
    scheduled_at: string;
    customer_first_name: string;
    customer_last_name: string;
    service_name: string;
  }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      setData(response as DashboardData);
      setLastUpdated(new Date());
      setMessage(null);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل بيانات لوحة التحكم' : 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
      confirmed: { label: language === 'ar' ? 'مؤكد' : 'Confirmed', variant: 'default' },
      completed: { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' },
      cancelled: { label: language === 'ar' ? 'ملغي' : 'Cancelled', variant: 'destructive' },
      refunded: { label: language === 'ar' ? 'مسترجع' : 'Refunded', variant: 'outline' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

  if (loading && !data) {
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

  const stats = data?.statistics;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8" />
                {language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {lastUpdated.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                variant={autoRefresh ? 'default' : 'outline'} 
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'تحديث تلقائي' : 'Auto Refresh'}
              </Button>
              <Button variant="outline" onClick={loadDashboard} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تحديث الآن' : 'Refresh Now'}
              </Button>
            </div>
          </div>

          {/* System Status */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {language === 'ar' ? 'النظام يعمل بشكل طبيعي' : 'System Operating Normally'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {language === 'ar' ? 'تحديث تلقائي كل 30 ثانية' : 'Auto-refresh every 30 seconds'}
                  </p>
                </div>
              </div>
              <Zap className="w-6 h-6 text-green-500" />
            </div>
          </Card>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Main KPIs - 6 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Users */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.users || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'مستخدمين نشطين' : 'Active users'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Service Providers */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'مقدمو الخدمات' : 'Service Providers'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.providers || 0}</h3>
                  {stats?.statistics.kpis.activeProviders && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      stats.statistics.kpis.activeProviders.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.statistics.kpis.activeProviders.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {stats.statistics.kpis.activeProviders.value} {language === 'ar' ? 'نشط' : 'active'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Total Services */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-teal-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الخدمات' : 'Total Services'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.services || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'خدمات متاحة' : 'Available services'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Bookings */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.bookings || 0}</h3>
                  {stats?.statistics.kpis.weekBookings && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      stats.statistics.kpis.weekBookings.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.statistics.kpis.weekBookings.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(stats.statistics.kpis.weekBookings.change).toFixed(1)}% {language === 'ar' ? 'من الأسبوع الماضي' : 'from last week'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Total Revenue */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.revenue.total.toFixed(2)} SAR</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'إيرادات مدفوعة' : 'Paid revenue'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Commission */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي العمولات' : 'Total Commission'}
                  </p>
                  <h3 className="text-2xl font-bold">{stats?.revenue.commission.toFixed(2)} SAR</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? '10% من الإيرادات' : '10% of revenue'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Operational Alerts */}
          {stats?.statistics.alerts && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {language === 'ar' ? 'التنبيهات التشغيلية' : 'Operational Alerts'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.statistics.alerts.pendingProviders > 0 && (
                  <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <div className="flex items-start justify-between mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <Badge variant="secondary">{stats.statistics.alerts.pendingProviders}</Badge>
                    </div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {language === 'ar' ? 'مزودون بانتظار التحقق' : 'Pending Providers'}
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                      {language === 'ar' ? 'يتطلب مراجعة فورية' : 'Requires immediate review'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'مراجعة' : 'Review'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}
                
                {stats.statistics.alerts.overdueBookings > 0 && (
                  <Card className="p-4 border-red-500 bg-red-50 dark:bg-red-950">
                    <div className="flex items-start justify-between mb-2">
                      <Clock className="h-5 w-5 text-red-500" />
                      <Badge variant="destructive">{stats.statistics.alerts.overdueBookings}</Badge>
                    </div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      {language === 'ar' ? 'حجوزات متأخرة' : 'Overdue Bookings'}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      {language === 'ar' ? 'تجاوزت الموعد المحدد' : 'Past scheduled time'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'عرض' : 'View'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {stats.statistics.alerts.pendingRefunds > 0 && (
                  <Card className="p-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <div className="flex items-start justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-orange-500" />
                      <Badge variant="secondary">{stats.statistics.alerts.pendingRefunds}</Badge>
                    </div>
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      {language === 'ar' ? 'طلبات استرداد معلقة' : 'Pending Refunds'}
                    </h4>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                      {language === 'ar' ? 'يتطلب معالجة' : 'Requires processing'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'معالجة' : 'Process'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {Number(stats.statistics.alerts.cancellationSpike) > 20 && (
                  <Card className="p-4 border-red-500 bg-red-50 dark:bg-red-950">
                    <div className="flex items-start justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-red-500" />
                      <Badge variant="destructive">{stats.statistics.alerts.cancellationSpike.toFixed(1)}%</Badge>
                    </div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      {language === 'ar' ? 'ارتفاع في الإلغاءات' : 'Cancellation Spike'}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      {language === 'ar' ? 'زيادة غير طبيعية' : 'Abnormal increase'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'تحليل' : 'Analyze'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <UserCheck className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'مراجعة المزودين' : 'Review Providers'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Calendar className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'الحجوزات المعلقة' : 'Pending Bookings'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'التحليلات التفصيلية' : 'Detailed Analytics'}</span>
              </Button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bookings Over Time */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === 'ar' ? 'الحجوزات خلال آخر 30 يوم' : 'Bookings - Last 30 Days'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats?.statistics.charts.bookingsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name={language === 'ar' ? 'الحجوزات' : 'Bookings'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Bookings by Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                {language === 'ar' ? 'الحجوزات حسب الحالة' : 'Bookings by Status'}
              </h3>
              <div className="space-y-3">
                {Object.entries(stats?.bookingsByStatus || {}).map(([status, count], index) => {
                  const total = Object.values(stats?.bookingsByStatus || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{getStatusBadge(status).label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{count}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Revenue by Category */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'الإيرادات حسب الفئة' : 'Revenue by Category'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.statistics.charts.revenueByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="revenue" 
                    fill="#00C49F"
                    name={language === 'ar' ? 'الإيرادات' : 'Revenue'}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Cities */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {language === 'ar' ? 'أعلى المدن نشاطاً' : 'Top Active Cities'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.statistics.charts.topCities || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="bookings" 
                    fill="#FFBB28"
                    name={language === 'ar' ? 'الحجوزات' : 'Bookings'}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {language === 'ar' ? 'أحدث 5 حجوزات' : 'Latest 5 Bookings'}
            </h3>
            <div className="space-y-3">
              {data?.recentBookings.slice(0, 5).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}
                </p>
              ) : (
                data?.recentBookings.slice(0, 5).map((booking) => (
                  <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="font-semibold text-sm">{booking.service_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'العميل:' : 'Customer:'} {booking.customer_first_name} {booking.customer_last_name}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {booking.total_amount.toFixed(2)} SAR
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.scheduled_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <Badge variant={getStatusBadge(booking.status).variant as any}>
                          {getStatusBadge(booking.status).label}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}