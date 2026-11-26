import type { APIRoute } from 'astro';
import { getServices } from '../../../lib/db/store';
import { jsonResponse } from '../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const services = await getServices();
    return jsonResponse({
      success: true,
      data: services,
    });
  } catch (error: any) {
    return jsonResponse({ success: false, error: 'Failed to retrieve services' }, 500);
  }
};
