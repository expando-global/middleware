import test from 'ava';
import { requestContextMiddleware } from './request-context';
import { makeMockContext } from '../testing/mock-context';
import { makeMockFn } from 'expando-mock-fn';
import { Next } from 'koa';
import { ObjectId } from 'mongodb';

test('constructs RequestContext from Koa.Context', async (t) => {
    const middleware = requestContextMiddleware();
    const mockContext = makeMockContext();
    const next = makeMockFn<Next>();

    const token = 'ia984aX-9a8dF2';
    const companyId = new ObjectId();

    // @ts-ignore
    mockContext.request.token = token;
    mockContext.params = { companyId };

    await middleware(mockContext, next);

    t.true(next.hasBeenCalled);
    t.deepEqual(mockContext.params.requestContext, {
        companyId,
        ip: mockContext.request.ip,
        token: '******X-9a8dF2',
        endpoint: 'GET http://localhost:3333/resources?limit=2',
    });
});
