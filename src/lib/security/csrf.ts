/**
 * Validates request Origin and Referer headers for state-mutating requests (POST, PATCH, DELETE).
 * Protects cookie-authenticated administrative endpoints from Cross-Site Request Forgery.
 */
export function validateCsrfOrigin(request: Request): { valid: boolean; reason?: string } {
  const method = request.method.toUpperCase();
  // Safe idempotent methods
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { valid: true };
  }

  // If request is authenticated via Bearer token in Authorization header,
  // it is immune to browser ambient-credential CSRF
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { valid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // If both origin and referer are missing in a browser request with cookie
  const cookieHeader = request.headers.get('cookie');
  const hasAuthCookie = cookieHeader && cookieHeader.includes('welfare_admin_token=');

  if (hasAuthCookie && !origin && !referer) {
    // Suspect ambient cookie submission without origin metadata
    return { valid: false, reason: 'Missing Origin and Referer headers for credentialed mutation' };
  }

  const targetOrigin = origin || (referer ? new URL(referer).origin : null);
  if (!targetOrigin) {
    return { valid: true }; // Non-credentialed or local programmatic client
  }

  try {
    const originUrl = new URL(targetOrigin);
    const originHost = originUrl.host;

    // Allowed hosts
    const isLocalhost = originHost.startsWith('localhost:') || originHost.startsWith('127.0.0.1:');
    const isProductionVercel =
      originHost === 'welfare-hospital-website.vercel.app' ||
      originHost.endsWith('.vercel.app') ||
      (host && originHost === host);

    if (isLocalhost || isProductionVercel) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Untrusted cross-origin mutation request blocked from origin: ${targetOrigin}`,
    };
  } catch (err) {
    return { valid: false, reason: 'Malformed Origin or Referer header' };
  }
}
