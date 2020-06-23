import test from 'ava';
import _ from 'lodash';
import { Next } from 'koa';
import { makeMockFn } from 'expando-mock-fn';
import { makeMockContext } from '../testing/mock-context';

import { loggingMiddleware } from './logging';

test('correctly logs a request info', async (t) => {
    const middleware = loggingMiddleware();

    let calledWith;
    console.info = function () {
        calledWith = arguments[0];
    };

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();
    _.set(mockContext, 'response.header.response-time', '26ms');
    _.set(mockContext, 'status', '200');

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(calledWith, 'GET /resources?limit=2 (200) [26ms]')
});
