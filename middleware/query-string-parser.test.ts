import test from 'ava';
import { makeMockFn } from 'expando-mock-fn';
import { Next } from 'koa';
import { makeMockContext } from '../testing/mock-context';
import faker from 'faker';
import _ from 'lodash';
import {
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    parseStringParam,
    queryStringParser,
    isValidStringParam,
    isValidDateParam,
    DEFAULT_SORT,
} from './query-string-parser';
import { BadRequest } from 'expando-api-errors';

test('limit out of boundaries (max)', async (t) => {
    const middleware = queryStringParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.querystring', 'limit=' + (MAX_PAGE_LIMIT + 1));

    await t.throwsAsync(middleware(mockContext, next), {
        instanceOf: BadRequest,
    });

    t.is(next.hasBeenCalled, false);

    const suitablePageLimit = 5;
    _.set(mockContext, 'request.querystring', 'limit=' + suitablePageLimit);
    await middleware(mockContext, next);
    t.is(next.hasBeenCalled, true);
});

test('defaults in query provided', async (t) => {
    const middleware = queryStringParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.querystring', '');

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.query.limit, DEFAULT_PAGE_LIMIT);
    t.is(mockContext.query.afterId, undefined);
});

test('page number out of boundaries', async (t) => {
    const middleware = queryStringParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.querystring', 'page=0');

    await t.throwsAsync(middleware(mockContext, next), {
        instanceOf: BadRequest,
    });

    t.is(next.hasBeenCalled, false);

    _.set(mockContext, 'request.querystring', 'page=2');
    await middleware(mockContext, next);
    t.is(next.hasBeenCalled, true);
});

test('can read different variants of "pageNumber" param', async (t) => {
    const middleware = queryStringParser();

    const alternatives = ['page'];
    t.plan(alternatives.length);

    for (let alt of alternatives) {
        const next = makeMockFn<Next>();
        const mockContext = makeMockContext();
        const num = faker.random.number(99) + 1;

        _.set(mockContext, 'request.querystring', `${alt}=${num}`);
        await middleware(mockContext, next);
        t.is(mockContext.query.pageNumber, num);
    }
});

test('can read different variants of "limit" param', async (t) => {
    const middleware = queryStringParser();

    const alternatives = [
        'limit',
        'perPage',
        'per_page',
        'page_limit',
        'pageLimit',
        'max_results',
        'maxresults',
        'maxResults',
    ];
    t.plan(alternatives.length);

    for (let alt of alternatives) {
        const next = makeMockFn<Next>();
        const mockContext = makeMockContext();
        const limit = faker.random.number(99) + 1;

        _.set(mockContext, 'request.querystring', `${alt}=${limit}`);
        await middleware(mockContext, next);
        t.is(mockContext.query.limit, limit);
    }
});

test('limit out of boundaries (min)', async (t) => {
    const middleware = queryStringParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.querystring', 'limit=0');

    await t.throwsAsync(middleware(mockContext, next), {
        instanceOf: BadRequest,
    });

    t.is(next.hasBeenCalled, false);
});

test('parse channel query string param', (t) => {
    const emptyRequestQuery = undefined;
    t.is(parseStringParam('channel', emptyRequestQuery), undefined);

    const oneChannel = { channel: 'amazon_de' };
    t.deepEqual(parseStringParam('channel', oneChannel), 'amazon_de');

    const qsTwoChannels = { channel: 'amazon_de,alza_cz' };
    t.deepEqual(parseStringParam('channel', qsTwoChannels), [
        'amazon_de',
        'alza_cz',
    ]);

    const commaInParam = { channel: '"ano, šéfe"' };
    t.deepEqual(parseStringParam('channel', commaInParam), 'ano, šéfe');
});

test('channel query string parameter contains valid values', (t) => {
    const channel = 'amazon_de';
    t.true(isValidStringParam(channel));

    const twoChannels = ['amazon_es', 'alza_cz'];
    t.true(isValidStringParam(twoChannels));

    const number = 3;
    t.false(isValidStringParam(number));

    const channelAndNumber = ['amazon_es', 3];
    t.false(isValidStringParam(channelAndNumber));
});

test('check if date is valid', (t) => {
    const date = new Date(1);
    t.true(isValidDateParam(date));

    const invalidDate = new Date('asdf');
    t.false(isValidDateParam(invalidDate));
});

test('can read different variants of "sortBy" param', async (t) => {
    const middleware = queryStringParser();

    const alternatives = ['sortBy', 'sortby', 'sort', 'sort_by'];
    t.plan(alternatives.length);

    for (let alt of alternatives) {
        const next = makeMockFn<Next>();
        const mockContext = makeMockContext();

        _.set(mockContext, 'request.querystring', `${alt}=asc(someField)`);
        await middleware(mockContext, next);
        t.deepEqual(mockContext.query.sortBy, { someField: 1 });
    }
});

test('invalid sort format', async (t) => {
    const middleware = queryStringParser();
    const next = makeMockFn<Next>();

    const mockContext = makeMockContext();
    _.set(mockContext, 'request.querystring', 'sortBy=ascend(someField)');

    await t.throwsAsync(middleware(mockContext, next), {
        instanceOf: BadRequest,
    });

    t.is(next.hasBeenCalled, false);
});

test('can read different case variants of field name in sort', async (t) => {
    const middleware = queryStringParser();

    const alternatives = [
        'someField',
        'some field',
        'some-field',
        'some_field',
    ];
    t.plan(alternatives.length);

    for (let alt of alternatives) {
        const next = makeMockFn<Next>();
        const mockContext = makeMockContext();

        _.set(mockContext, 'request.querystring', `sortBy=desc(${alt})`);
        await middleware(mockContext, next);
        t.deepEqual(mockContext.query.sortBy, { someField: -1 });
    }
});

test('can read sort correctly', async (t) => {
    const middleware = queryStringParser();

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    _.set(
        mockContext,
        'request.querystring',
        `sortBy=desc(purchaseDate),asc(id)`,
    );
    await middleware(mockContext, next);
    t.deepEqual(mockContext.query.sortBy, { purchaseDate: -1, id: 1 });
});

test('gives default sort when none is given in query', async (t) => {
    const middleware = queryStringParser();

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    await middleware(mockContext, next);
    t.deepEqual(mockContext.query.sortBy, DEFAULT_SORT);
});
