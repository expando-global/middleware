import { Next, Context } from 'koa';
import _ from 'lodash';
import { IRequestContext } from 'expando-request-context';

/**
 * Middleware for creating a custom request context used inside the application.
 * TODO: Add Request-Id from header?
 */
export function requestContextMiddleware() {
    return async (context: Context, next: Next) => {
        const { ip, method, origin, url } = context.request;

        // @ts-ignore
        const token = context.request.token || 'UNKNOWN_TOKEN!';

        const showLast = 8;
        const hiddenToken =
            '*'.repeat(token.length - showLast) +
            token.substring(token.length - showLast);

        const requestContext: IRequestContext = {
            companyId: context.params.companyId,
            ip,
            token: hiddenToken,
            endpoint: `${method} ${origin}${url}`,
        };

        _.set(context.params, 'requestContext', requestContext);

        return await next();
    };
}
