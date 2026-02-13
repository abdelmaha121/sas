type WhereValue = string | number | boolean;

export class QueryBuilder {
  private baseQuery: string;
  private whereClauses: string[] = [];
  private params: WhereValue[] = [];
  private orderByClause = '';
  private limitClause = '';
  private groupByClause = '';
  private limitValue: number | null = null;

  constructor(baseQuery: string) {
    this.baseQuery = baseQuery;
  }

  where(condition: string, ...values: WhereValue[]) {
    if (!condition) return this;

    for (const val of values) {
      if (val === undefined || val === null) {
        throw new Error(`Invalid value for WHERE clause: ${val}`);
      }
    }

    this.whereClauses.push(condition);
    this.params.push(...values);
    return this;
  }

  orderBy(orderBy: string) {
    if (!orderBy) return this;
    this.orderByClause = ` ORDER BY ${orderBy}`;
    return this;
  }

  limit(limit?: number) {
    if (limit === undefined || limit === null) return this;
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error(`Invalid LIMIT value: ${limit}`);
    }
    this.limitValue = Math.floor(limit);
    this.limitClause = ` LIMIT ${this.limitValue}`;
    return this;
  }

  groupBy(groupBy: string) {
    if (!groupBy) return this;
    this.groupByClause = ` GROUP BY ${groupBy}`;
    return this;
  }

  build() {
    const where = this.whereClauses.length > 0 
      ? ` WHERE ${this.whereClauses.join(' AND ')}` 
      : '';
    
    const sql = this.baseQuery + where + this.groupByClause + this.orderByClause + this.limitClause;
    
    return { sql, params: this.params };
  }
}