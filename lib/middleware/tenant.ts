import { NextRequest } from 'next/server';
import { query } from '../db/mysql';
import { Tenant } from '../types/database';

export async function getTenantFromRequest(request: NextRequest): Promise<Tenant | null> {
  const host = request.headers.get('host') || '';
  const subdomain = host.split('.')[0];

  const subdomainHeader = request.headers.get('x-tenant-subdomain');
  let tenantSubdomain = subdomainHeader || subdomain;

  // console.log({ host, subdomain, subdomainHeader, tenantSubdomain });
  // Default to 'demo' tenant for localhost development
  if (tenantSubdomain === 'localhost:3000' || tenantSubdomain === '127') {
    tenantSubdomain = 'demo';
  }

  console.log({ tenantSubdomain });
  const tenant = await query<Tenant[]>(
    'SELECT * FROM tenants WHERE subdomain = ? AND status = ? LIMIT 1',
    [tenantSubdomain, 'active']
  );
  console.log({tenant})

  return tenant.length > 0 ? tenant[0] : null;
}

export function buildTenantFilter(tenantId: string): string {
  return `tenant_id = '${tenantId}'`;
}
