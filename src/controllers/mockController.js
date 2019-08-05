import mockData from '@services/mockData';

class MockController {
  insertData = (ctx) => {
    mockData.insertAll();

    ctx.body = {
      success: true,
    };
  }
}

export default new MockController();