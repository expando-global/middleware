import { Next, Context, Middleware } from 'koa';
import { respondWithError, ApiError } from 'expando-api-errors';
import Joi, { JoiObject } from '@hapi/joi';
import _ from 'lodash';

interface Schemas {
    body?: JoiObject;
    params?: JoiObject;
    query?: JoiObject;
}

/**
 * Middleware for API input validation.
 */
export function validate(schemas: Schemas): Middleware {
    return async (context: Context, next: Next) => {
        for (const [requestField, schema] of Object.entries(schemas)) {
            const { error, value } = Joi.validate(
                // @ts-ignore
                context.request[requestField] || context[requestField] || null,
                schema,
                {
                    allowUnknown: false,
                },
            );

            if (error)
                return respondWithError(
                    context,
                    400,
                    ApiError.InvalidInputError,
                    `${_.capitalize(requestField)} validation error: ${
                        error.message
                    }`,
                );

            for (const key in value) {
                // @ts-ignore
                if (context?.request?.[requestField])
                    // @ts-ignore
                    context.request[requestField][key] = value[key];
                else context[requestField][key] = value[key];
            }
        }
        await next();
    };
}
