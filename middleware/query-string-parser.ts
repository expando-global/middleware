import { Context, Next } from 'koa';
import qs from 'qs';
import _ from 'lodash';
import { BadRequest } from 'expando-api-errors';

export const DEFAULT_PAGE_LIMIT = 50;
export const DEFAULT_PAGE_NUMBER = 1;
export const MAX_PAGE_LIMIT = 100;
export const DEFAULT_SORT = { id: -1 };

function parseSortBy(requestQuery: qs.ParsedQs) {
    const sortByQuery =
        (requestQuery['sortBy'] as string) ||
        (requestQuery['sortby'] as string) ||
        (requestQuery['sort'] as string) ||
        (requestQuery['sort_by'] as string);

    if (!sortByQuery) return DEFAULT_SORT;

    const sortByEntries = sortByQuery.split(',');

    const sortByPairs = sortByEntries.map((sortByEntry) => {
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
        sortByPairs.map(([order, field]) => [
            _.camelCase(field),
            order.toLowerCase() === 'asc' ? 1 : -1,
        ]),
    );
}

export function isValidPageLimit(pageLimit: any) {
    return _.inRange(pageLimit, 1, MAX_PAGE_LIMIT + 1);
}

function parseLimit(requestQuery: qs.ParsedQs): number {
    const requestedLimit =
        (requestQuery['limit'] as string) ||
        (requestQuery['perPage'] as string) ||
        (requestQuery['per_page'] as string) ||
        (requestQuery['max_results'] as string) ||
        (requestQuery['maxResults'] as string) ||
        (requestQuery['maxresults'] as string) ||
        (requestQuery['page_limit'] as string) ||
        (requestQuery['pageLimit'] as string);

    if (requestedLimit && !isValidPageLimit(requestedLimit)) {
        throw new BadRequest(
            'Number of items per page has to be between 1 and 100.',
        );
    }
    return requestedLimit ? parseInt(requestedLimit) : DEFAULT_PAGE_LIMIT;
}

export function isValidPageNumber(pageNumber: any) {
    return _.inRange(pageNumber, 1, Number.MAX_SAFE_INTEGER);
}

function parsePageNumber(requestQuery: qs.ParsedQs): number {
    const requestedPageNumber = requestQuery['page'] as string;

    if (requestedPageNumber && !isValidPageNumber(requestedPageNumber)) {
        throw new BadRequest('Page number has to be at least 1.');
    }
    return requestedPageNumber
        ? parseInt(requestedPageNumber)
        : DEFAULT_PAGE_NUMBER;
}

export function parseStringParam(attr: string, queryString?: qs.ParsedQs) {
    if (!queryString) return;
    const qsparam = queryString[attr] as string;
    if (!qsparam) return;
    let parsed;
    if (qsparam.startsWith('"') && qsparam.endsWith('"')) {
        parsed = qsparam.slice(1, -1);
    } else {
        parsed = qsparam.includes(',') ? qsparam.split(',') : qsparam.trim();
    }

    if (parsed) {
        if (!isValidStringParam(qsparam)) {
            throw new BadRequest(`'${attr}' input is invalid.`);
        }
    }

    return parsed;
}

export function isValidStringParam(param: any) {
    if (!param) return;
    if (Array.isArray(param)) {
        return param.every((item) => typeof item === 'string');
    } else {
        return typeof param === 'string';
    }
}

export function parseDateParam(attr: string, queryString?: qs.ParsedQs) {
    if (!queryString) return;
    const qsparam = queryString[attr] as string;
    if (!qsparam) return;
    let parsed;

    if (qsparam.startsWith('"') && qsparam.endsWith('"')) {
        parsed = new Date(qsparam.slice(1, -1));
    } else {
        parsed = new Date(qsparam);
    }
    if (parsed) {
        if (!isValidDateParam(parsed)) {
            throw new BadRequest(`'${attr}' input is invalid.`);
        }
    }

    return parsed;
}

export function isValidDateParam(param: any) {
    return !!param.getTime();
}

/**
 * It will provide parameters in request's query.
 */
export function queryStringParser() {
    return async (context: Context, next: Next) => {
        const requestQuery = qs.parse(context.request.querystring, {
            parseArrays: true,
        });

        context.query.limit = parseLimit(requestQuery);
        context.query.pageNumber = parsePageNumber(requestQuery);

        context.query.channel = parseStringParam('channel', requestQuery);
        context.query.channelOrderId = parseStringParam(
            'channelOrderId',
            requestQuery,
        );
        context.query.status = parseStringParam('status', requestQuery);
        context.query.fulfillmentService = parseStringParam(
            'fulfillmentService',
            requestQuery,
        );
        context.query.purchasedAfter = parseDateParam(
            'purchasedAfter',
            requestQuery,
        );
        context.query.updatedAfter = parseDateParam(
            'updatedAfter',
            requestQuery,
        );
        context.query.shouldShipBy = parseDateParam(
            'shouldShipBy',
            requestQuery,
        );

        context.query.sortBy = parseSortBy(requestQuery);

        await next();
    };
}
