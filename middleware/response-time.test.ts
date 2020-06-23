import test from 'ava';
import _ from 'lodash';
import { Next } from 'koa';
import { makeMockFn } from 'expando-mock-fn';
import { makeMockContext } from '../testing/mock-context';

import { responseTimeMiddleware } from './response-time';

test('middleware decorates response header with response time', async (t) => {
    const middleware = responseTimeMiddleware();

    const mockContext = makeMockContext();
    const next = makeMockFn<Next>();

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(_.has(mockContext.headers, 'response-time'), true);
    t.is(mockContext.headers['response-time'].includes('ms'), true);
});
