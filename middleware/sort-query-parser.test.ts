import test from 'ava';
import { makeMockFn } from 'expando-mock-fn';
import { Next } from 'koa';
import { makeMockContext } from '../testing/mock-context';
import _ from 'lodash';
import { sortQueryParser } from './sort-query-parser';
import { BadRequest } from 'expando-api-errors';

test('correctly parses sort params', async (t) => {
    const alternatives = ['sortBy', 'sortby', 'sort', 'sort_by'];
    t.plan(alternatives.length);

    for (let alt of alternatives) {
        const next = makeMockFn<Next>();
        const mockContext = makeMockContext();

        const middleware = sortQueryParser(alt);

        _.set(mockContext, `request.query.${alt}`, [
            'asc(someField)',
            'desc(otherField)',
        ]);
        await middleware(mockContext, next);
        t.deepEqual(mockContext.query[alt], { someField: 1, otherField: -1 });
    }
});

test('invalid sort format', async (t) => {
    const middleware = sortQueryParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.query.sortBy', 'ascend(someField)');

    await t.throwsAsync(middleware(mockContext, next), {
        instanceOf: BadRequest,
    });

    t.is(next.hasBeenCalled, false);
});
