import { Context } from 'koa';

/**
 * Creates a mock Koa context.
 */
export function makeMockContext() {
    const method = 'GET';
    const body = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
    const origin = 'http://localhost:3333'
    const path = '/resources'
    const query = { limit: '2' };
    const querystring = 'limit=2';
    const url = path + '?' + querystring
    const ip = '192.168.0.66';

    return {
        url,
        request: {
            url,
            querystring,
            query,
            origin,
            path,
            method,
            body,
            ip,
        },
        response: {
            header: {},
            headers: {},
        },
        method,
        query,
        body,
        ip,
        headers: {},
        header: {},
        set: function (k: string, v: string) {
            [
                this.headers,
                this.header,
                this.response.header,
                this.response.headers,
            ].forEach((head) => {
                head[k.toLowerCase()] = v;
            });
        },
    } as Context;
}
