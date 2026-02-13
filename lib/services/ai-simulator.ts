import { query } from '../db/mysql';
import { QueryBuilder } from '../db/queryBuilder';
import { SearchQuery, SearchResult } from '../types/database';

export class AISimulator {
  static async getRecommendations(params: {
    userId: string;
    tenantId: string;
    limit: number;
  }) {
    const { tenantId, limit } = params;

    if (!tenantId) throw new Error('tenantId is required');
    if (!limit || limit <= 0) throw new Error('limit must be a positive number');

    const qb = new QueryBuilder(`
      SELECT
        s.id,
        s.name,
        s.description,
        s.base_price,
        s.category_id,
        s.provider_id,
        c.name AS category_name,
        p.business_name AS provider_name,
        p.rating,
        COUNT(r.id) AS review_count
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      JOIN service_providers p ON s.provider_id = p.id
      LEFT JOIN reviews r ON r.service_id = s.id
    `);

    qb
      .where('s.tenant_id = ?', tenantId)
      .where('s.is_active = 1')
      .groupBy('s.id, s.name, s.description, s.base_price, s.category_id, s.provider_id, c.name, p.business_name, p.rating')
      .orderBy('p.rating DESC, COUNT(r.id) DESC')
      .limit(limit);

    const { sql, params: queryParams } = qb.build();
    console.log('SQL:', sql);
    console.log('Params:', queryParams);

    const services = await query(sql, queryParams);
    return services || [];
  }

  static async smartSearch(
    params: SearchQuery,
    tenantId: string
  ): Promise<SearchResult> {
    const { query: searchText, category, location, minRating = 0, maxPrice } = params;

    if (!tenantId) throw new Error('tenantId is required');

    const keywords = searchText
      ?.toLowerCase()
      .split(' ')
      .filter((k: string) => k.length > 2) || [];

    /** SERVICES QUERY */
    const servicesQB = new QueryBuilder(`
      SELECT
        s.id,
        s.name,
        s.description,
        s.base_price,
        s.category_id,
        s.provider_id,
        c.name AS category_name,
        p.business_name AS provider_name,
        p.rating,
        COUNT(r.id) AS review_count
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      JOIN service_providers p ON s.provider_id = p.id
      LEFT JOIN reviews r ON r.service_id = s.id
    `);

    servicesQB.where('s.tenant_id = ?', tenantId).where('s.is_active = 1');

    // معالجة الكلمات المفتاحية
    if (keywords.length > 0) {
      const keywordConditions = keywords
        .map(() => '(s.name LIKE ? OR s.description LIKE ?)')
        .join(' OR ');
      const keywordParams = keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
      servicesQB.where(`(${keywordConditions})`, ...keywordParams);
    }

    if (category?.trim()) servicesQB.where('c.name LIKE ?', `%${category}%`);
    if (location?.trim()) servicesQB.where('p.business_name LIKE ?', `%${location}%`);
    if (minRating > 0) servicesQB.where('p.rating >= ?', minRating);
    if (maxPrice !== undefined) servicesQB.where('s.base_price <= ?', maxPrice);

    servicesQB
      .groupBy('s.id, s.name, s.description, s.base_price, s.category_id, s.provider_id, c.name, p.business_name, p.rating')
      .orderBy('p.rating DESC, COUNT(r.id) DESC')
      .limit(20);

    const { sql: servicesSql, params: servicesParams } = servicesQB.build();

    /** PROVIDERS QUERY */
    const providersQB = new QueryBuilder(`
      SELECT
        p.id,
        p.business_name,
        p.description,
        p.rating,
        (
          SELECT COUNT(*)
          FROM services s
          WHERE s.provider_id = p.id AND s.is_active = 1
        ) AS service_count
      FROM service_providers p
    `);

    providersQB.where('p.tenant_id = ?', tenantId).where('p.is_active = 1');
    if (location?.trim()) providersQB.where('p.business_name LIKE ?', `%${location}%`);
    if (minRating > 0) providersQB.where('p.rating >= ?', minRating);

    providersQB.orderBy('p.rating DESC, service_count DESC').limit(10);

    const { sql: providersSql, params: providersParams } = providersQB.build();

    /** EXECUTION */
    const [services, providers] = await Promise.all([
      query(servicesSql, servicesParams),
      query(providersSql, providersParams),
    ]);

    return {
      services: services ?? [],
      providers: providers ?? [],
      explanation: `
Search keywords: ${keywords.join(', ') || 'none'}
Category: ${category || 'any'}
Location: ${location || 'any'}
Min rating: ${minRating || 'any'}
Max price: ${maxPrice || 'any'}
Results ranked by rating and popularity.
      `.trim(),
    };
  }
}