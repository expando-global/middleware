import test from 'ava';
import _ from 'lodash';
import { Next } from 'koa';
import { makeMockFn } from 'expando-mock-fn';
import { makeMockContext } from '../testing/mock-context';

import Joi from '@hapi/joi';

import { validate } from './validation';

test('successfully validates and casts body', async (t) => {
    const middleware = validate({
        body: Joi.object({
            requestAt: Joi.date().required(),
            items: Joi.array().items(
                Joi.object({ id: Joi.string().required() }),
            ),
        }),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();
    mockContext.request.body = {
        requestAt: '2020-06-23T16:55:35.379Z',
        items: mockContext.request.body,
    };

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.false(mockContext.status === 400);
    t.is(typeof mockContext.request.body.requestAt, 'object');
});

test('successfully rejects invalid body', async (t) => {
    const middleware = validate({
        body: Joi.object({ id: Joi.string() }).required(),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();
    mockContext.request.body = [];

    await middleware(mockContext, next);

    t.true(mockContext.status === 400);
    t.is(next.hasBeenCalled, false);
});

test('successfully validates and casts query', async (t) => {
    const middleware = validate({
        query: Joi.object({ limit: Joi.number().required() }),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    await middleware(mockContext, next);

    t.true(next.hasBeenCalled);
    t.false(mockContext.status === 400);
    t.is(typeof mockContext.request.query.limit, 'number');
});

test('successfully rejects invalid query', async (t) => {
    const middleware = validate({
        query: Joi.object({ updatedAfter: Joi.string().required() }),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    await middleware(mockContext, next);

    t.false(next.hasBeenCalled);
    t.true(mockContext.status === 400);
});

test('successfully validates params', async (t) => {
    const middleware = validate({
        params: Joi.object({ orderId: Joi.string().required() }),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();
    mockContext.params = {
        orderId: 'id123456789',
    };

    await middleware(mockContext, next);

    t.true(next.hasBeenCalled);
    t.false(mockContext.status === 400);
});

test('successfully rejects invalid params', async (t) => {
    const middleware = validate({
        params: Joi.object({ orderId: Joi.string().required() }),
    });

    const next = makeMockFn<Next>();
    const mockContext = makeMockContext();

    await middleware(mockContext, next);

    t.false(next.hasBeenCalled);
    t.true(mockContext.status === 400);
});
