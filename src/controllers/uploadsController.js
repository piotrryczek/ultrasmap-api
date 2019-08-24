import ImageUpload from '@services/imageUpload';
import Club from '@models/club';

class UploadsController {
  upload = async (ctx) => {
    const { req: { file } } = ctx;

    const fileName = await ImageUpload.upload(file);

    ctx.body = {
      data: fileName,
      success: true,
    };
  }

  regenerateImageSizes = async (ctx) => {
    const clubs = await Club.find({});

    const images = clubs.map(club => club.logo);

    await ImageUpload.regenerateImages(images);

    ctx.body = {
      success: true,
    };
  }
}

export default new UploadsController();
