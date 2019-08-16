import mockData from '@services/mockData';

import Activity from '@models/activity';

class MockController {
  insertData = async (ctx) => {
    const {
      user,
      request: {
        body,
      },
    } = ctx;

    const { mockType = 'all' } = body;

    switch (mockType) {
      case 'all': {
        await mockData.insertAll();
        break;
      }

      case 'users': {
        await mockData.clearUsers();
        await mockData.insertUsers();
        break;
      }

      case 'clubs': {
        await mockData.clearClubs();
        await mockData.insertClubs();
        break;
      }

      default:
        break;
    }

    // const activity = new Activity({
    //   user,
    //   originalObject: null,
    //   objectType: 'mock',
    //   actionType: 'insert',
    //   before: null,
    //   after: null,
    // });

    // await activity.save();

    ctx.body = {
      success: true,
    };
  }
}

export default new MockController();
