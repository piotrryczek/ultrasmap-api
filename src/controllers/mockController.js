import mockData from '@services/mockData';

class MockController {
  insertData = async (ctx) => {
    await mockData.insertAll();

    ctx.body = {
      success: true,
    };
  }
}

export default new MockController();
