import {
  PER_PAGE,
} from '@config/config';

import Activity from '@models/activity';

class ActivitiesController {
  getPaginated = async (ctx) => {
    const { query } = ctx;
    const { page } = query;

    const activities = await Activity.find(
      null,
      null,
      {
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      },
    );

    ctx.body = {
      data: activities,
    };
  }
}

export default new ActivitiesController();
