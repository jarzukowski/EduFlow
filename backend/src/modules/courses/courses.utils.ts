import type { ParsedQs } from 'qs';

import { parsePagination } from '../../common/http/parsePagination';
import { parseSearch } from '../../common/http/parseSearch';

import {
    COURSE_DEFAULT_LIMIT,
    COURSE_MAX_LIMIT,
} from './courses.constants';

import type { GetCoursesQueryDTO } from './courses.types';

export const parseGetCoursesQuery = (query: ParsedQs): GetCoursesQueryDTO => {
    const { page, limit } = parsePagination(query, {
        defaultLimit: COURSE_DEFAULT_LIMIT,
        maxLimit: COURSE_MAX_LIMIT,
    });

    const search = parseSearch(query, 'search', {
        minLength: 1,
        maxLength: 100,
    });

    return { page, limit, search };
};