/**
 * Base path of the REST API. It is relative on purpose: in development `ng serve` proxies it to
 * the backend (proxy.conf.json) and in Docker Nginx does the same, so the browser never needs CORS.
 */
export const API_URL = '/api/v1';
