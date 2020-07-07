import * as Joi from 'typesafe-joi';

export const SORT_QUERY_ERROR = `Not a valid sort format. Valid examples: 'asc(fieldName)' or 'desc(fieldName)'`;

export const SortQueryRegex = /(asc|desc)\(([\w\s-]+)\)/i;

export const makeSortSchema = (valid: string[]) => {
    const SortSchema = Joi.string()
        .regex(new RegExp(`(asc|desc)\\((${valid.join('|')})\\)`))
        .error((e) => `${e}. ${SORT_QUERY_ERROR}`);

    return Joi.alternatives([SortSchema, Joi.array().items(SortSchema)]);
};
