import mockData from '@services/mockData';

class MockController {
  insertData = async (ctx) => {
    const {
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

    ctx.body = {
      success: true,
    };
  }
}

export default new MockController();
