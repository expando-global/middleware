import { Next, Context } from 'koa';
import { ApiError, respondWithError } from 'expando-api-errors';
// @ts-ignore
import bearerToken from 'koa-bearer-token';
import compose from 'koa-compose';
import got from 'got';
import { ObjectId } from 'mongodb';

export interface IApiTokenAccess {
    companyId: ObjectId;
    access: { [key: string]: string[] };
}

// COPYPASTED FROM GATEWAY
function checkTokenAccess(
    accessToken: IApiTokenAccess,
    operation: string,
    path: string,
): boolean {
    if (!accessToken || !accessToken.access) return false;
    let tokenOperation = accessToken.access[path];
    if (tokenOperation) return tokenOperation.includes(operation);
    else {
        const sortedPaths = Object.keys(accessToken.access).sort(
            (a, b) => b.length - a.length,
        );
        for (let regexPath of sortedPaths) {
            let regex = new RegExp('^' + regexPath + '$');
            if (regex.exec(path))
                return accessToken.access[regexPath].includes(operation);
        }
    }
    return false;
}

async function getAccessToken(token: string): Promise<IApiTokenAccess> {
    const url: string = process.env.GATEWAY_URL || '';
    let response = await got.get(url, {
        path: '/api-access/' + encodeURIComponent(token),
        headers: {
            Authorization: 'Bearer ' + process.env.EVE_AUTH_BEARER,
        },
    });
    let result = JSON.parse(response.body);
    result.companyId = result.companyId && new ObjectId(result.companyId);
    return result;
}

/**
 * Middleware for messages incoming to API.
 */
export function authenticationMiddleware() {
    return compose([
        bearerToken(),
        async (context: Context, next: Next) => {
            // @ts-ignore
            const { method, path, token } = context.request;
            const accessToken = await getAccessToken(token);

            if (checkTokenAccess(accessToken, method, path)) {
                if (!context.params) context.params = {};
                Object.assign(context.params, accessToken);
                return await next();
            } else {
                respondWithError(
                    context,
                    accessToken.companyId ? 403 : 401,
                    ApiError.AuthenticationError,
                );
                console.warn(`Unauthorized API Access`);
            }
        },
    ]);
}
