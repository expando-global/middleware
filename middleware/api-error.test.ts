import test from 'ava';
import { Next } from 'koa';
import { makeMockFn } from 'expando-mock-fn';
import { makeMockContext } from '../testing/mock-context';

import { apiErrorMiddleware } from './api-error';
import { ApiError, NotFound, BadRequest } from 'expando-api-errors';

// mute error console for this test
console.error = function () {};

test('business middleware throws error, catching', async (t) => {
    t.plan(3);
    const middleware = apiErrorMiddleware();

    const mockContext = makeMockContext();
    const next = makeMockFn<Next>(() => {
        throw new Error('Ooops!');
    });

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.status, 500);
    t.is(mockContext.body.errorCode, ApiError.InternalError);
});

test('catching not found error', async (t) => {
    t.plan(3);
    const middleware = apiErrorMiddleware();

    const mockContext = makeMockContext();
    const next = makeMockFn<Next>(() => {
        throw new NotFound('something wasnt found');
    });

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.status, 404);
    t.is(mockContext.body.errorCode, ApiError.InvalidInputError);
});

test('catching validation error', async (t) => {
    t.plan(3);
    const middleware = apiErrorMiddleware();

    const mockContext = makeMockContext();
    const next = makeMockFn<Next>(() => {
        throw new BadRequest('validation failed');
    });

    await middleware(mockContext, next);

    t.is(next.hasBeenCalled, true);
    t.is(mockContext.status, 400);
    t.is(mockContext.body.errorCode, ApiError.InvalidInputError);
});
