import test from 'ava';
import nock from 'nock';
import { authenticationMiddleware } from './authentication';
import { makeMockContext } from '../testing/mock-context';
import { makeMockFn } from 'expando-mock-fn';
import { Next } from 'koa';

test.serial('check all 3 types of authentication', async (t) => {
    nock(process.env.GATEWAY_URL || '', { encodedQueryParams: true })
        .get('/api-access/token123')
        .times(3)
        .reply(200, {
            companyId: '5ebd483b2bb08a9deaceaa82',
            access: { '/.*': ['GET', 'PUT', 'POST', 'DELETE'] },
        });

    t.plan(3);
    try {
        for (let i = 0; i < 3; i++) {
            const middleware = authenticationMiddleware();
            let mockContext = makeMockContext();
            switch (i) {
                case 0:
                    mockContext.request.query = { access_token: 'token123' };
                    break;
                case 1:
                    mockContext.request.body = { access_token: 'token123' };
                    break;
                case 2:
                    mockContext.request.header = {
                        authorization: 'Bearer token123',
                    };
                    break;
            }
            mockContext.request.method = 'GET';
            const next = makeMockFn<Next>();
            await middleware(mockContext, next);
            t.truthy(next.hasBeenCalled);
        }
    } catch (e) {
        t.fail(e);
    }
});

test.serial('check enriched context', async (t) => {
    nock(process.env.GATEWAY_URL || '', { encodedQueryParams: true })
        .get('/api-access/token123')
        .reply(200, {
            companyId: '5ebd483b2bb08a9deaceaa82',
            access: { '/.*': ['GET', 'PUT', 'POST', 'DELETE'] },
        });

    const middleware = authenticationMiddleware();
    let mockContext = makeMockContext();
    mockContext.request.header = {
        authorization: 'Bearer token123',
    };
    mockContext.request.method = 'GET';
    const next = makeMockFn<Next>();
    await middleware(mockContext, next);
    t.is(
        (mockContext.params as any).companyId.toHexString(),
        '5ebd483b2bb08a9deaceaa82',
    );
    t.deepEqual((mockContext.params as any).access, {
        '/.*': ['GET', 'PUT', 'POST', 'DELETE'],
    });
    t.truthy(next.hasBeenCalled);
});

test.serial('not allowed call', async (t) => {
    nock(process.env.GATEWAY_URL || '', { encodedQueryParams: true })
        .get('/api-access/token123')
        .reply(200, {
            companyId: '5ebd483b2bb08a9deaceaa82',
            access: { '/.*': ['PUT', 'POST', 'DELETE'] },
        });

    const middleware = authenticationMiddleware();
    let mockContext = makeMockContext();
    mockContext.request.header = {
        authorization: 'Bearer token123',
    };
    mockContext.request.method = 'GET';
    const next = makeMockFn<Next>();
    await middleware(mockContext, next);
    t.falsy(next.hasBeenCalled);
    t.is(mockContext.status, 403);
});

test.serial('not found', async (t) => {
    nock(process.env.GATEWAY_URL || '', { encodedQueryParams: true })
        .get('/api-access/token123')
        .reply(200, {
            companyId: null,
            access: { },
        });

    const middleware = authenticationMiddleware();
    let mockContext = makeMockContext();
    mockContext.request.header = {
        authorization: 'Bearer token123',
    };
    mockContext.request.method = 'GET';
    const next = makeMockFn<Next>();
    await middleware(mockContext, next);
    t.falsy(next.hasBeenCalled);
    t.is(mockContext.status, 401);
});