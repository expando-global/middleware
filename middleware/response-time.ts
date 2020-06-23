import { Next, Context } from 'koa';

/**
 * Writes the total system response time to response header.
 */
export function responseTimeMiddleware() {
    return async (context: Context, next: Next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        context.set('Response-Time', `${ms}ms`);
    };
}