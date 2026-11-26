import type { APIRoute } from 'astro';
import { jsonResponse } from '../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async () => {
  return jsonResponse({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Welfare Hospital Digital Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
  });
};
