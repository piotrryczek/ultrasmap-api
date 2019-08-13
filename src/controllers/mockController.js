import mockData from '@services/mockData';

import Activity from '@models/activity';

class MockController {
  insertData = async (ctx) => {
    const { user } = ctx;

    await mockData.insertAll();

    const activity = new Activity({
      user,
      originalObject: null,
      objectType: 'mock',
      actionType: 'insert',
      before: null,
      after: null,
    });

    await activity.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new MockController();
