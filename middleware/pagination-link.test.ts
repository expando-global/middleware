import test from 'ava';
import _ from 'lodash';
import { Next } from 'koa';
import { makeMockFn } from 'expando-mock-fn';
import { makeMockContext } from '../testing/mock-context';

import { paginationLinkMiddleware } from './pagination-link';

test('no collection of resources returned, no link provided', async (t) => {
    const middleware = paginationLinkMiddleware();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'body', {});

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.body?._links?.next, undefined);
});

test('less resources than limit, no link provided', async (t) => {
    const middleware = paginationLinkMiddleware();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    mockContext.body = { _items: mockContext.body };
    _.set(mockContext, 'request.querystring', 'limit=5');
    _.set(mockContext, 'query', { limit: 5 });

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.body?._links?.next, undefined);
});

test('no of resources & limit are same, a link is provided', async (t) => {
    const middleware = paginationLinkMiddleware();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    mockContext.body = { _items: mockContext.body };
    _.set(mockContext, 'request.querystring', 'limit=3');

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.deepEqual(mockContext.body?._links?.next, {
        title: 'next page',
        href: '/resources?limit=3&page=2',
        method: 'GET',
    });
});
