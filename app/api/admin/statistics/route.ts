import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { Parser as Json2CsvParser } from 'json2csv';

export const GET = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
  try {
    const tenantId = request.user!.tenantId;
    const exportFormat = request.nextUrl.searchParams.get('export'); // 'csv' | 'json'
    const filter = request.nextUrl.searchParams.get('filter') || 'all';
    const serviceId = request.nextUrl.searchParams.get('serviceId');
    const providerId = request.nextUrl.searchParams.get('providerId');

    // بناء شرط WHERE ديناميكي للفلترة
    let whereConditions = [`b.tenant_id = ?`];
    const params: any[] = [tenantId];

    if (filter !== 'all') {
      let startDate = '';
      const today = new Date();
      switch (filter) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          whereConditions.push(`DATE(b.created_at) = ?`);
          params.push(startDate);
          break;
        case 'week':
          const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          startDate = firstDayOfWeek.toISOString().split('T')[0];
          whereConditions.push(`DATE(b.created_at) >= ?`);
          params.push(startDate);
          break;
        case 'month':
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = firstDayOfMonth.toISOString().split('T')[0];
          whereConditions.push(`DATE(b.created_at) >= ?`);
          params.push(startDate);
          break;
        case 'year':
          const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
          startDate = firstDayOfYear.toISOString().split('T')[0];
          whereConditions.push(`DATE(b.created_at) >= ?`);
          params.push(startDate);
          break;
      }
    }

    if (serviceId) {
      whereConditions.push(`b.service_id = ?`);
      params.push(serviceId);
    }

    if (providerId) {
      whereConditions.push(`b.provider_id = ?`);
      params.push(providerId);
    }

    const whereSQL = whereConditions.join(' AND ');

    // استعلامات البيانات
    const [
      totalUsersResult,
      totalProvidersResult,
      totalServicesResult,
      totalRevenueResult,
      totalBookingsResult,
      bookingsByStatusResult,
      recentBookingsResult,
      averageProviderRatingsResult,
      activePromoCodesResult,
      revenueByDateResult,
      todayBookingsResult,
      weekBookingsResult,
      prevTodayBookingsResult,
      prevWeekBookingsResult,
      activeProvidersResult,
      prevActiveProvidersResult,
      cancellationRateResult,
      prevCancellationRateResult,
      totalRevenue30DaysResult,
      totalRevenuePrev30DaysResult,
      bookingsOverTimeResult,
      revenueByCategoryResult,
      topCitiesResult,
      pendingProvidersResult,
      overdueBookingsResult,
      pendingRefundsResult,
      cancellationSpikeResult
    ] = await Promise.all([
      // إجمالي المستخدمين
      query<any[]>(
        `SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND role = 'customer'`,
        [tenantId]
      ),
      // إجمالي مقدمي الخدمات
      query<any[]>(
        `SELECT COUNT(*) as count FROM service_providers WHERE tenant_id = ?`,
        [tenantId]
      ),
      // إجمالي الخدمات
      query<any[]>(
        `SELECT COUNT(*) as count FROM services WHERE tenant_id = ?`,
        [tenantId]
      ),
      // إجمالي الإيرادات المدفوعة
      query<any[]>(
        `SELECT IFNULL(SUM(b.total_amount), 0) as total FROM bookings b WHERE ${whereSQL} AND b.payment_status = 'paid'`,
        params
      ),
      // إجمالي عدد الحجوزات
      query<any[]>(
        `SELECT COUNT(*) as total FROM bookings b WHERE ${whereSQL}`,
        params
      ),
      // الحجوزات حسب الحالة
      query<any[]>(
        `SELECT b.status, COUNT(*) as count FROM bookings b WHERE ${whereSQL} GROUP BY b.status`,
        params
      ),
      // آخر 10 حجوزات مع معلومات العملاء والمزودين والخدمات
      query<any[]>(
        `
        SELECT b.id, b.status, b.total_amount, b.scheduled_at, b.created_at,
               u.first_name as customer_first_name, u.last_name as customer_last_name,
               sp.business_name as provider_name,
               s.name as service_name
        FROM bookings b
        INNER JOIN users u ON b.customer_id = u.id
        INNER JOIN service_providers sp ON b.provider_id = sp.id
        INNER JOIN services s ON b.service_id = s.id
        WHERE b.tenant_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
        `,
        [tenantId]
      ),
      // متوسط تقييمات المزودين من جدول reviews
      query<any[]>(
        `
        SELECT r.provider_id, IFNULL(AVG(r.rating), 0) as avg_rating 
        FROM reviews r
        WHERE r.tenant_id = ? 
        GROUP BY r.provider_id
        `,
        [tenantId]
      ),
      // كوبونات الخصم النشطة
      query<any[]>(
        `
        SELECT code, discount_type, discount_value, used_count, max_uses, valid_until 
        FROM promo_codes 
        WHERE tenant_id = ? AND is_active = 1
        `,
        [tenantId]
      ),
      // الإيرادات حسب التاريخ
      query<any[]>(
        `
        SELECT DATE(b.created_at) as date, IFNULL(SUM(b.total_amount),0) as revenue
        FROM bookings b
        WHERE ${whereSQL} AND b.payment_status = 'paid'
        GROUP BY DATE(b.created_at)
        ORDER BY DATE(b.created_at) ASC
        `,
        params
      ),
      // KPIs: حجوزات اليوم
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND DATE(b.created_at) = CURDATE()`,
        [tenantId]
      ),
      // KPIs: حجوزات الأسبوع الحالي
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND YEARWEEK(b.created_at, 1) = YEARWEEK(CURDATE(), 1)`,
        [tenantId]
      ),
      // KPIs: حجوزات اليوم السابق
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND DATE(b.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
        [tenantId]
      ),
      // KPIs: حجوزات الأسبوع السابق
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND YEARWEEK(b.created_at, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)`,
        [tenantId]
      ),
      // KPIs: المزودون النشطون المتحققون
      query<any[]>(
        `SELECT COUNT(*) as count FROM service_providers sp WHERE sp.tenant_id = ? AND sp.verification_status = 'verified' AND sp.is_active = 1`,
        [tenantId]
      ),
      // KPIs: المزودون النشطون قبل 7 أيام
      query<any[]>(
        `SELECT COUNT(*) as count FROM service_providers sp WHERE sp.tenant_id = ? AND sp.verification_status = 'verified' AND sp.is_active = 1 AND sp.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [tenantId]
      ),
      // KPIs: معدل الإلغاء في آخر 30 يوم
      query<any[]>(
        `
        SELECT IFNULL((COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 0) as rate 
        FROM bookings b
        WHERE b.tenant_id = ? AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `,
        [tenantId]
      ),
      // KPIs: معدل الإلغاء السابق (30-60 يوم)
      query<any[]>(
        `
        SELECT IFNULL((COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 0) as rate 
        FROM bookings b
        WHERE b.tenant_id = ? AND b.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
        `,
        [tenantId]
      ),
      // KPIs: إجمالي الإيرادات آخر 30 يوم
      query<any[]>(
        `
        SELECT IFNULL(SUM(b.total_amount), 0) as total 
        FROM bookings b
        WHERE b.tenant_id = ? AND b.payment_status = 'paid' AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `,
        [tenantId]
      ),
      // KPIs: إجمالي الإيرادات 30 يوم السابقة
      query<any[]>(
        `
        SELECT IFNULL(SUM(b.total_amount),0) as total 
        FROM bookings b
        WHERE b.tenant_id = ? AND b.payment_status = 'paid' AND b.created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `,
        [tenantId]
      ),
      // Charts: الحجوزات خلال آخر 30 يوم
      query<any[]>(
        `
        SELECT DATE(b.created_at) as date, COUNT(*) as count 
        FROM bookings b
        WHERE b.tenant_id = ? AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
        GROUP BY DATE(b.created_at) 
        ORDER BY date
        `,
        [tenantId]
      ),
      // Charts: الإيرادات حسب الفئة (أعلى 5)
      query<any[]>(
        `
        SELECT sc.name as category, IFNULL(SUM(b.total_amount),0) as revenue 
        FROM bookings b 
        INNER JOIN services s ON b.service_id = s.id 
        INNER JOIN service_categories sc ON s.category_id = sc.id 
        WHERE b.tenant_id = ? AND b.payment_status = 'paid' 
        GROUP BY sc.id, sc.name
        ORDER BY revenue DESC 
        LIMIT 5
        `,
        [tenantId]
      ),
      // Charts: المدن النشطة (أعلى 10) باستخدام JSON_EXTRACT من customer_address
      query<any[]>(
        `
        SELECT JSON_UNQUOTE(JSON_EXTRACT(b.customer_address, '$.city')) AS city, COUNT(*) as bookings
        FROM bookings b
        WHERE b.tenant_id = ? AND b.customer_address IS NOT NULL AND JSON_EXTRACT(b.customer_address, '$.city') IS NOT NULL
        GROUP BY JSON_EXTRACT(b.customer_address, '$.city')
        ORDER BY bookings DESC
        LIMIT 10
        `,
        [tenantId]
      ),
      // Alerts: المزودون في انتظار التحقق
      query<any[]>(
        `SELECT COUNT(*) as count FROM service_providers sp WHERE sp.tenant_id = ? AND sp.verification_status = 'pending'`,
        [tenantId]
      ),
      // Alerts: الحجوزات المتأخرة (confirmed أو in_progress والموعد المجدول قد مضى)
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND b.status IN ('confirmed', 'in_progress') AND b.scheduled_at < NOW()`,
        [tenantId]
      ),
      // Alerts: المبالغ المستردة المعلقة
      query<any[]>(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.tenant_id = ? AND b.status = 'refunded' AND b.payment_status = 'refund_pending'`,
        [tenantId]
      ),
      // Alerts: زيادة الإلغاءات (مقارنة بين الأسبوع الماضي والأسبوع الذي قبله)
      query<any[]>(
        `
        SELECT 
          IFNULL(
            (SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) / 
            NULLIF((SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)), 0) * 100, 0
          ) as spike
        `,
        [tenantId, tenantId]
      )
    ]);

    // تحضير البيانات
    const totalRevenue = Number(totalRevenueResult[0]?.total || 0);
    const commissionRate = 0.1; // افتراض 10% عمولة
    const totalCommission = totalRevenue * commissionRate;

    const statistics = {
      users: totalUsersResult[0]?.count || 0,
      providers: totalProvidersResult[0]?.count || 0,
      services: totalServicesResult[0]?.count || 0,
      bookings: totalBookingsResult[0]?.total || 0,
      revenue: {
        total: totalRevenue,
        commission: totalCommission
      },
      bookingsByStatus: bookingsByStatusResult.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      recentBookings: recentBookingsResult,
      statistics: {
        kpis: {
          todayBookings: {
            value: todayBookingsResult[0]?.count || 0,
            change: prevTodayBookingsResult[0]?.count ? ((todayBookingsResult[0]?.count - prevTodayBookingsResult[0]?.count) / prevTodayBookingsResult[0]?.count) * 100 : 0
          },
          weekBookings: {
            value: weekBookingsResult[0]?.count || 0,
            change: prevWeekBookingsResult[0]?.count ? ((weekBookingsResult[0]?.count - prevWeekBookingsResult[0]?.count) / prevWeekBookingsResult[0]?.count) * 100 : 0
          },
          activeProviders: {
            value: activeProvidersResult[0]?.count || 0,
            change: prevActiveProvidersResult[0]?.count ? ((activeProvidersResult[0]?.count - prevActiveProvidersResult[0]?.count) / prevActiveProvidersResult[0]?.count) * 100 : 0
          },
          cancellationRate: {
            value: Number(cancellationRateResult[0]?.rate || 0),
            change: Number(prevCancellationRateResult[0]?.rate || 0) - Number(cancellationRateResult[0]?.rate || 0)
          }
        },
        charts: {
          bookingsOverTime: bookingsOverTimeResult.map(item => ({
            date: item.date,
            count: item.count
          })),
          revenueByCategory: revenueByCategoryResult.map(item => ({
            category: item.category,
            revenue: Number(item.revenue)
          })),
          topCities: topCitiesResult.map(item => ({
            city: item.city || 'غير محدد',
            bookings: item.bookings
          }))
        },
        alerts: {
          pendingProviders: pendingProvidersResult[0]?.count || 0,
          overdueBookings: overdueBookingsResult[0]?.count || 0,
          pendingRefunds: pendingRefundsResult[0]?.count || 0,
          cancellationSpike: Number(cancellationSpikeResult[0]?.spike || 0)
        }
      }
    };

    // التصدير
    if (exportFormat === 'csv') {
      const parser = new Json2CsvParser({ flatten: true } as any);
      const csv = parser.parse(statistics);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="analytics_${Date.now()}.csv"`
        }
      });
    } else if (exportFormat === 'json') {
      return NextResponse.json(statistics);
    }

    // الافتراضي: JSON مع الحجوزات الأخيرة
    return NextResponse.json({
      statistics,
      recentBookings: recentBookingsResult
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});