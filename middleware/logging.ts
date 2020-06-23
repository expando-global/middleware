import { Next, Context } from 'koa';

/**
 * Middleware for logging server requests.
 */
export function loggingMiddleware() {
    return async (context: Context, next: Next) => {
        await next();
        console.info(
            `${context.method} ${context.url} (${context.status}) [${context.response.header['response-time']}]`,
        );
    };
}
