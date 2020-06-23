import { Next, Context } from 'koa';
import qs from 'qs';
import _ from 'lodash';

function provideNextLink(
    context: Context,
    pageLimit: number,
    requestQuery: qs.ParsedQs,
) {
    const items = _.get(context.body, '_items', null);

    if (items) {
        if (!items.length || items.length < pageLimit) return;

        const lastItem = items[items.length - 1];

        if (_.has(lastItem, 'id')) {
            const { path } = context.request;

            const nextPageQs = qs.stringify({
                ...requestQuery,
                page: context.query.pageNumber + 1 || 2,
            });
            const nextPageLink = path + '?' + nextPageQs;

            _.set(context.body, '_links.next', {
                title: 'next page',
                href: nextPageLink,
                method: context.request.method,
            });
        }
    }
}

/**
 * Middleware for providing link to the next page.
 */
export function paginationLinkMiddleware() {
    return async (context: Context, next: Next) => {
        await next();

        const requestQuery = qs.parse(context.request.querystring);
        provideNextLink(context, context.query.limit, requestQuery);
    };
}
