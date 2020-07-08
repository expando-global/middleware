import test from 'ava';
import { makeMockFn } from 'expando-mock-fn';
import { Next } from 'koa';
import { makeMockContext } from '../testing/mock-context';
import _ from 'lodash';

import { queryArrayParserMiddlware } from './query-array-parser';

test('correctly parses array query params', async (t) => {
    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    const middleware = queryArrayParserMiddlware();

    _.set(mockContext, 'querystring', 'field=one%2Ctwo');
    await middleware(mockContext, next);
    t.deepEqual(mockContext.query, { field: ['one', 'two'] });
});
