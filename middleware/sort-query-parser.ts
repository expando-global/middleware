import { Context, Next } from 'koa';
import _ from 'lodash';
import { BadRequest } from 'expando-api-errors';

function parseSort(sortQuery?: string | string[]) {
    if (!sortQuery) return undefined;

    const sortByQuery = Array.isArray(sortQuery) ? sortQuery : [sortQuery];

    const sortByPairs = sortByQuery.map((sortByEntry) => {
        const orderAndFieldMatch = sortByEntry
            .match(/(asc|desc)\(([\w\s-]+)\)/i)
            ?.slice(1);

        if (!orderAndFieldMatch || orderAndFieldMatch.length !== 2)
            throw new BadRequest(
                `'${sortByEntry}' is not a valid sort format. Valid examples: 'asc(fieldName)' or 'desc(fieldName)'`,
            );

        return orderAndFieldMatch;
    });

    return _.fromPairs(
        sortByPairs.map(([sortOrder, field]) => [
            field,
            sortOrder.toLowerCase() === 'asc' ? 1 : -1,
        ]),
    );
}

/**
 * Will parse sort query in given `fieldName`.
 */
export function sortQueryParser(fieldName: string = 'sortBy') {
    return async (context: Context, next: Next) => {
        if (context?.query?.[fieldName]) {
            context.query[fieldName] = parseSort(context.query[fieldName]);
        } else if (context?.request?.query?.[fieldName]) {
            context.request.query[fieldName] = parseSort(
                context.request.query[fieldName],
            );
        }

        await next();
    };
}
