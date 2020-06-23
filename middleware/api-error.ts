import { Next, Context } from 'koa';
import { ApiError, respondWithError } from 'expando-api-errors';

const NO_DETAILS = `No details available. If you seek resolution, please contact <devops@expan.do>`;

/**
 * Middleware for converting application errors to API errors.
 */
export function apiErrorMiddleware() {
    return async (context: Context, next: Next) => {
        try {
            return await next();
        } catch (error) {
            if (error?.httpError === 400) {
                return respondWithError(
                    context,
                    400,
                    ApiError.InvalidInputError,
                    error.message || NO_DETAILS,
                );
            } else if (error?.httpError === 404) {
                return respondWithError(
                    context,
                    404,
                    ApiError.InvalidInputError,
                    error.message || NO_DETAILS,
                );
            } else {
                console.error(error);
                const message = `Internal Error: ${
                    error.message || NO_DETAILS
                }`;
                return respondWithError(
                    context,
                    500,
                    ApiError.InternalError,
                    message,
                );
            }
        }
    };
}
