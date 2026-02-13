'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ShoppingBag, Calendar, DollarSign, Star, TrendingUp, TrendingDown,
  Download, RefreshCw, Users, Activity, Clock, Zap, ArrowRight,
  CheckCircle2, AlertTriangle, FileText, BarChart3, MapPin
} from 'lucide-react';

interface Statistics {
  services: number;
  bookings: number;
  earnings: number;
  rating: {
    average: number;
    total: number;
  };
  bookingsByStatus: Record<string, number>;
  recentBookings?: any[];
  statistics?: {
    kpis: {
      todayBookings: { value: number; change: number };
      weekBookings: { value: number; change: number };
      monthEarnings: { value: number; change: number };
      activeServices: { value: number; change: number };
    };
    charts: {
      bookingsOverTime: { date: string; count: number }[];
      earningsByCategory: { category: string; earnings: number }[];
      topServices: { service: string; bookings: number }[];
    };
    alerts: {
      pendingBookings: number;
      todayScheduled: number;
      lowRatedServices: number;
      expiringSoon: number;
    };
  };
}

export default function ProviderDashboardPage() {
  const { language } = useLanguage();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatistics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/provider/statistics', {
        headers: { 'x-tenant-subdomain': 'demo' },
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStatistics(data.statistics);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(language === 'ar' ? 'فشل في تحميل الإحصائيات' : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const exportData = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/provider/export?format=${format}`, {
        headers: { 'x-tenant-subdomain': 'demo' },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provider-data-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', variant: 'secondary' },
      confirmed: { label: language === 'ar' ? 'مؤكد' : 'Confirmed', variant: 'default' },
      in_progress: { label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', variant: 'default' },
      completed: { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' },
      cancelled: { label: language === 'ar' ? 'ملغي' : 'Cancelled', variant: 'destructive' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

  if (loading && !statistics) {
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
                <Activity className="w-8 h-8" />
                {language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'}{' '}
                {lastUpdated.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${autoRefresh ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'تحديث تلقائي' : 'Auto Refresh'}
              </Button>
              <Button variant="outline" onClick={fetchStatistics} size="sm">
                <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'تحديث الآن' : 'Refresh Now'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('excel')}
                disabled={exporting}
              >
                <Download className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {exporting 
                  ? (language === 'ar' ? 'جاري التصدير...' : 'Exporting...') 
                  : (language === 'ar' ? 'تصدير البيانات' : 'Export Data')}
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

          {error && (
            <Alert className="mb-6 border-destructive">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* Main KPIs - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الخدمات' : 'Total Services'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.services || 0}</h3>
                  {statistics?.statistics?.kpis.activeServices && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      statistics.statistics.kpis.activeServices.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {statistics.statistics.kpis.activeServices.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {statistics.statistics.kpis.activeServices.value} {language === 'ar' ? 'نشط' : 'active'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.bookings || 0}</h3>
                  {statistics?.statistics?.kpis.weekBookings && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      statistics.statistics.kpis.weekBookings.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {statistics.statistics.kpis.weekBookings.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(statistics.statistics.kpis.weekBookings.change).toFixed(1)}%{' '}
                      {language === 'ar' ? 'من الأسبوع الماضي' : 'from last week'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.earnings.toFixed(2)} SAR</h3>
                  {statistics?.statistics?.kpis.monthEarnings && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      statistics.statistics.kpis.monthEarnings.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {statistics.statistics.kpis.monthEarnings.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(statistics.statistics.kpis.monthEarnings.change).toFixed(1)}%{' '}
                      {language === 'ar' ? 'من الشهر الماضي' : 'from last month'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'التقييم' : 'Rating'}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {statistics?.rating.average.toFixed(1)} ⭐
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics?.rating.total} {language === 'ar' ? 'تقييم' : 'reviews'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Operational Alerts */}
          {statistics?.statistics?.alerts && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {language === 'ar' ? 'التنبيهات التشغيلية' : 'Operational Alerts'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statistics.statistics.alerts.pendingBookings > 0 && (
                  <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <div className="flex items-start justify-between mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <Badge variant="secondary">{statistics.statistics.alerts.pendingBookings}</Badge>
                    </div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {language === 'ar' ? 'حجوزات معلقة' : 'Pending Bookings'}
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                      {language === 'ar' ? 'يتطلب تأكيد' : 'Requires confirmation'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'عرض' : 'View'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {statistics.statistics.alerts.todayScheduled > 0 && (
                  <Card className="p-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-start justify-between mb-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <Badge variant="default">{statistics.statistics.alerts.todayScheduled}</Badge>
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      {language === 'ar' ? 'حجوزات اليوم' : "Today's Bookings"}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      {language === 'ar' ? 'مجدولة اليوم' : 'Scheduled today'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'عرض' : 'View'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {statistics.statistics.alerts.lowRatedServices > 0 && (
                  <Card className="p-4 border-red-500 bg-red-50 dark:bg-red-950">
                    <div className="flex items-start justify-between mb-2">
                      <Star className="h-5 w-5 text-red-500" />
                      <Badge variant="destructive">{statistics.statistics.alerts.lowRatedServices}</Badge>
                    </div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      {language === 'ar' ? 'خدمات منخفضة التقييم' : 'Low Rated Services'}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      {language === 'ar' ? 'يحتاج تحسين' : 'Needs improvement'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'مراجعة' : 'Review'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {statistics.statistics.alerts.expiringSoon > 0 && (
                  <Card className="p-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <div className="flex items-start justify-between mb-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <Badge variant="secondary">{statistics.statistics.alerts.expiringSoon}</Badge>
                    </div>
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      {language === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}
                    </h4>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                      {language === 'ar' ? 'خدمات أو عروض' : 'Services or offers'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'تجديد' : 'Renew'} <ArrowRight className="w-3 h-3 ml-1" />
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
                <ShoppingBag className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'إضافة خدمة' : 'Add Service'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Calendar className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'عرض الحجوزات' : 'View Bookings'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <DollarSign className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'الأرباح' : 'Earnings'}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">{language === 'ar' ? 'الموظفين' : 'Staff'}</span>
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
                <LineChart data={statistics?.statistics?.charts.bookingsOverTime || []}>
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
                <Activity className="w-5 h-5" />
                {language === 'ar' ? 'الحجوزات حسب الحالة' : 'Bookings by Status'}
              </h3>
              <div className="space-y-3">
                {Object.entries(statistics?.bookingsByStatus || {}).map(([status, count], index) => {
                  const total = Object.values(statistics?.bookingsByStatus || {}).reduce((a, b) => a + b, 0);
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

            {/* Earnings by Category */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'الأرباح حسب الفئة' : 'Earnings by Category'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statistics?.statistics?.charts.earningsByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar
                    dataKey="earnings"
                    fill="#00C49F"
                    name={language === 'ar' ? 'الأرباح' : 'Earnings'}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Services */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {language === 'ar' ? 'أعلى الخدمات طلباً' : 'Top Services'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statistics?.statistics?.charts.topServices || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" fontSize={12} />
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
              {statistics?.recentBookings?.slice(0, 5).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}
                </p>
              ) : (
                statistics?.recentBookings?.slice(0, 5).map((booking) => (
                  <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="font-semibold text-sm">{booking.service_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'العميل:' : 'Customer:'} {booking.customer_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {booking.amount.toFixed(2)} SAR
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
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
    </ProviderLayout>
  );
}