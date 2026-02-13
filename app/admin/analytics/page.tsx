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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, Calendar, Star, Ticket, TrendingUp, TrendingDown,
  Users, AlertTriangle, FileDown, Activity, ShoppingBag, MapPin
} from 'lucide-react';

interface Statistics {
  totalRevenue: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  averageProviderRatings: Record<string, number>;
  activePromoCodes: any[];
  revenueByDate: { date: string; revenue: number }[];
  KPIs: {
    todayBookings: number;
    weekBookings: number;
    prevTodayBookings: number;
    prevWeekBookings: number;
    activeProviders: number;
    prevActiveProviders: number;
    cancellationRate: string;
    prevCancellationRate: string;
    totalRevenue30Days: number;
    totalRevenuePrev30Days: number;
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
    cancellationSpike: string;
  };
}

interface Booking {
  id: string;
  status: string;
  total_amount: number;
  scheduled_at: string;
  created_at: string;
  customer_first_name: string;
  customer_last_name: string;
  provider_name: string;
  service_name: string;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user, filterPeriod, filterService, filterProvider]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPeriod !== 'all') params.append('filter', filterPeriod);
      if (filterService !== 'all') params.append('serviceId', filterService);
      if (filterProvider !== 'all') params.append('providerId', filterProvider);
      
      const queryString = params.toString();
      const url = `/admin/analytics${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<{ statistics: Statistics; recentBookings: Booking[] }>(url);
      
      setStatistics(data.statistics);
      setRecentBookings(data.recentBookings);
      setMessage(null);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل تحميل البيانات التحليلية' : 'Failed to load analytics data' 
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams();
      params.append('export', 'csv');
      if (filterPeriod !== 'all') params.append('filter', filterPeriod);
      if (filterService !== 'all') params.append('serviceId', filterService);
      if (filterProvider !== 'all') params.append('providerId', filterProvider);

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      setMessage({ 
        type: 'success', 
        text: language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data' 
      });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToJSON = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams();
      params.append('export', 'json');
      if (filterPeriod !== 'all') params.append('filter', filterPeriod);
      if (filterService !== 'all') params.append('serviceId', filterService);
      if (filterProvider !== 'all') params.append('providerId', filterProvider);

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.json`);
      linkElement.click();

      setMessage({ 
        type: 'success', 
        text: language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data' 
      });
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' },
      confirmed: { label: language === 'ar' ? 'مؤكد' : 'Confirmed', variant: 'default' },
      in_progress: { label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', variant: 'default' },
      completed: { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' },
      cancelled: { label: language === 'ar' ? 'ملغي' : 'Cancelled', variant: 'destructive' },
      refunded: { label: language === 'ar' ? 'مسترجع' : 'Refunded', variant: 'outline' }
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading && !statistics) {
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

  const avgRating = statistics 
    ? Object.values(statistics.averageProviderRatings).reduce((a, b) => a + b, 0) / 
      (Object.values(statistics.averageProviderRatings).length || 1)
    : 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8" />
                {language === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'تحليلات وإحصاءات شاملة للمنصة' : 'Comprehensive platform analytics and statistics'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={exportLoading} size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </Button>
              <Button variant="outline" onClick={exportToJSON} disabled={exportLoading} size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تصدير JSON' : 'Export JSON'}
              </Button>
            </div>
          </div>

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
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الفترة الزمنية' : 'Time Period'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'كل الفترات' : 'All Time'}</SelectItem>
                  <SelectItem value="today">{language === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                  <SelectItem value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</SelectItem>
                  <SelectItem value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</SelectItem>
                  <SelectItem value="year">{language === 'ar' ? 'هذا العام' : 'This Year'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الخدمة' : 'Service'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الخدمات' : 'All Services'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'المزود' : 'Provider'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع المزودين' : 'All Providers'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.totalRevenue.toFixed(2)} OMR</h3>
                  {statistics?.KPIs && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      Number(calculatePercentageChange(statistics.KPIs.totalRevenue30Days, statistics.KPIs.totalRevenuePrev30Days)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Number(calculatePercentageChange(statistics.KPIs.totalRevenue30Days, statistics.KPIs.totalRevenuePrev30Days)) >= 0 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />}
                      {calculatePercentageChange(statistics.KPIs.totalRevenue30Days, statistics.KPIs.totalRevenuePrev30Days)}%
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.totalBookings}</h3>
                  {statistics?.KPIs && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      Number(calculatePercentageChange(statistics.KPIs.weekBookings, statistics.KPIs.prevWeekBookings)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Number(calculatePercentageChange(statistics.KPIs.weekBookings, statistics.KPIs.prevWeekBookings)) >= 0 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />}
                      {calculatePercentageChange(statistics.KPIs.weekBookings, statistics.KPIs.prevWeekBookings)}%
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                  </p>
                  <h3 className="text-2xl font-bold">{avgRating.toFixed(1)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'من 5 نجوم' : 'out of 5 stars'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'أكواد ترويجية نشطة' : 'Active Promo Codes'}
                  </p>
                  <h3 className="text-2xl font-bold">{statistics?.activePromoCodes.length || 0}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'قيد الاستخدام' : 'In use'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Alerts Section */}
          {statistics?.alerts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statistics.alerts.pendingProviders > 0 && (
                <Alert className="border-yellow-500">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-sm">
                    <strong>{statistics.alerts.pendingProviders}</strong> {language === 'ar' ? 'مزود بانتظار التحقق' : 'providers pending verification'}
                  </AlertDescription>
                </Alert>
              )}
              
              {statistics.alerts.overdueBookings > 0 && (
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-sm">
                    <strong>{statistics.alerts.overdueBookings}</strong> {language === 'ar' ? 'حجز متأخر' : 'overdue bookings'}
                  </AlertDescription>
                </Alert>
              )}

              {statistics.alerts.pendingRefunds > 0 && (
                <Alert className="border-orange-500">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm">
                    <strong>{statistics.alerts.pendingRefunds}</strong> {language === 'ar' ? 'استرداد معلق' : 'pending refunds'}
                  </AlertDescription>
                </Alert>
              )}

              {Number(statistics.alerts.cancellationSpike) > 20 && (
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-sm">
                    {language === 'ar' ? 'زيادة في الإلغاءات بنسبة' : 'Cancellation spike'} <strong>{statistics.alerts.cancellationSpike}%</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'الإيرادات حسب التاريخ' : 'Revenue Over Time'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics?.revenueByDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name={language === 'ar' ? 'الإيرادات' : 'Revenue'}
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(statistics?.bookingsByStatus || {}).map(([key, value]) => ({
                      name: getStatusBadge(key).label,
                      value: value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(statistics?.bookingsByStatus || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue by Category */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'الإيرادات حسب الفئة' : 'Revenue by Category'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics?.charts.revenueByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#00C49F"
                    name={language === 'ar' ? 'الإيرادات' : 'Revenue'}
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics?.charts.topCities || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="bookings" 
                    fill="#FFBB28"
                    name={language === 'ar' ? 'الحجوزات' : 'Bookings'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Bookings Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {language === 'ar' ? 'آخر 10 حجوزات' : 'Last 10 Bookings'}
            </h3>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}
                </p>
              ) : (
                recentBookings.map((booking) => (
                  <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[150px]">
                        <h4 className="font-semibold">{booking.service_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(booking.scheduled_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                      
                      <div className="flex-1 min-w-[150px]">
                        <p className="text-sm">
                          <strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {booking.customer_first_name} {booking.customer_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>{language === 'ar' ? 'المزود:' : 'Provider:'}</strong> {booking.provider_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <DollarSign className="w-4 h-4" />
                        {booking.total_amount} SAR
                      </div>

                      <Badge variant={getStatusBadge(booking.status).variant as any}>
                        {getStatusBadge(booking.status).label}
                      </Badge>
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