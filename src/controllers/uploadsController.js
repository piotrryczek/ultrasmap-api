import ImageUpload from '@services/imageUpload';

class UploadsController {
  upload = async (ctx) => {
    const { req: { file } } = ctx;

    const fileName = await ImageUpload.upload(file);

    ctx.body = {
      data: fileName,
      success: true,
    };
  }
}

export default new UploadsController();
