import {
  PER_PAGE,
} from '@config/config';

import { parseSearchQuery } from '@utilities/helpers';
import Activity from '@models/activity';

class ActivitiesController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const { page } = query;

    const {
      search = '{}',
    } = query;

    const parsedSearch = parseSearchQuery(JSON.parse(search));

    const activities = await Activity.find(
      parsedSearch,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    )
      .sort({ createdAt: 'descending' })
      .populate('user');

    const allCount = await Activity.countDocuments(parsedSearch);

    ctx.body = {
      data: activities,
      allCount,
    };
  }
}

export default new ActivitiesController();
