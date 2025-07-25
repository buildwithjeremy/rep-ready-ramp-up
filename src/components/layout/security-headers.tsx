import { useEffect } from 'react';

/**
 * Component to set security headers via meta tags
 * Note: This provides basic client-side security policies
 * For production, implement these headers at the server/CDN level
 */
export function SecurityHeaders() {
  useEffect(() => {
    // Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wpinbiwlbsyqtayqixea.supabase.co;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data:;
      connect-src 'self' https://wpinbiwlbsyqtayqixea.supabase.co https://api.eztexting.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();
    
    // X-Frame-Options
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    
    // X-Content-Type-Options
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    
    // Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    
    // Add all meta tags to head
    document.head.appendChild(cspMeta);
    document.head.appendChild(frameMeta);
    document.head.appendChild(contentTypeMeta);
    document.head.appendChild(referrerMeta);
    
    // Cleanup function
    return () => {
      document.head.removeChild(cspMeta);
      document.head.removeChild(frameMeta);
      document.head.removeChild(contentTypeMeta);
      document.head.removeChild(referrerMeta);
    };
  }, []);
  
  return null; // This component doesn't render anything
}