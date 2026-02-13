import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { AISimulator } from '@/lib/services/ai-simulator';

export async function GET() {
  try {
    const [categories, featuredServices, topProviders, aiRecommendations] = await Promise.all([
      // 🔹 1️⃣ Active Categories (limit 8)
      query(
        `SELECT id, name, name_ar, description, icon_url AS icon, display_order
         FROM service_categories
         WHERE is_active = TRUE
         ORDER BY display_order ASC
         LIMIT 8`
      ),

      // 🔹 2️⃣ Featured Services (top 6 by bookings)
      query(
        `SELECT s.id, s.name, s.name_ar, s.description, s.description_ar,
                s.base_price, s.currency, s.duration_minutes,
                s.pricing_type, s.is_active,
                sc.id as category_id, sc.name as category_name, sc.name_ar as category_name_ar,
                sp.id as provider_id, sp.business_name as provider_name, sp.business_name_ar as provider_name_ar,
                sp.rating as provider_rating,
                (SELECT AVG(r.rating) FROM reviews r WHERE r.service_id = s.id) as avg_rating,
                (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id) as review_count
         FROM services s
         LEFT JOIN service_categories sc ON s.category_id = sc.id
         LEFT JOIN service_providers sp ON s.provider_id = sp.id
         WHERE s.is_active = TRUE
         ORDER BY (
           SELECT COUNT(*)
           FROM bookings b
           WHERE b.service_id = s.id
         ) DESC
         LIMIT 6`
      ),

      // 🔹 3️⃣ Top Providers (limit 6 by total bookings)
      query(
        `SELECT sp.id, sp.business_name, sp.business_name_ar, sp.description,
                sp.rating as avg_rating, sp.total_reviews, sp.total_bookings,
                sp.verification_status, sp.featured, sp.commission_rate, sp.created_at,
                u.email, u.phone
         FROM service_providers sp
         INNER JOIN users u ON sp.user_id = u.id
         WHERE sp.verification_status = 'verified' AND sp.is_active = TRUE
         ORDER BY (
           SELECT COUNT(*)
           FROM bookings b
           INNER JOIN services s ON b.service_id = s.id
           WHERE s.provider_id = sp.id
         ) DESC
         LIMIT 6`
      ),

      // 🔹 4️⃣ AI-Powered Recommendations (for anonymous users)
      AISimulator.getRecommendations({
        userId: 'guest',
        tenantId: 'default',
        limit: 6
      })
    ]);

    return NextResponse.json({
      categories: categories || [],
      featuredServices: featuredServices || [],
      topProviders: topProviders || [],
      aiRecommendations: aiRecommendations || null
    });

  } catch (error) {
    console.error('Home data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 }
    );
  }
}
