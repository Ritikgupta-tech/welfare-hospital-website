import type { APIRoute } from 'astro';
import { getDoctors } from '../../../lib/db/store';
import { jsonResponse } from '../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const doctors = await getDoctors();
    return jsonResponse({
      success: true,
      data: doctors,
    });
  } catch (error: any) {
    return jsonResponse({ success: false, error: 'Failed to retrieve doctors' }, 500);
  }
};
