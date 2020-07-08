import { Next, Context } from 'koa';
import queryString from 'query-string';

/**
 * Parses comma-separated array parameters in query.
 */
export function queryArrayParserMiddlware() {
    return async (context: Context, next: Next) => {
        context.query = queryString.parse(
            decodeURIComponent(context.querystring),
            {
                arrayFormat: 'comma',
            },
        );
        await next();
    };
}
