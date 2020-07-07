import * as Joi from 'typesafe-joi';

export const GenericQuerySchema = {
    access_token: Joi.string(),
};

export const PaginationQuerySchema = {
    limit: Joi.number().integer().min(1).max(100).default(50),
    page: Joi.number().integer().min(1).default(1),
};

export const makeSortSchema = (valid: string[]) => {
    const SortSchema = Joi.string().regex(
        new RegExp(`(asc|desc)\\((${valid.join('|')})\\)`),
    );

    return Joi.alternatives([SortSchema, Joi.array().items(SortSchema)]);
};
