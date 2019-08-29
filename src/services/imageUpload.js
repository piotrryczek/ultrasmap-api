import fs from 'fs';
import { v4 } from 'uuid';
import Jimp from 'jimp';

import { imagesHeights } from '@config/config';

// TODO: File validation
class ImageUpload {
  upload = async (file) => {
    const {
      path,
      originalname,
    } = file;

    const finalFilename = `${v4()};${originalname}`;
    const finalPath = `uploads/${finalFilename}`;

    await fs.promises.rename(path, finalPath);

    const resizePromises = imagesHeights.map(height => new Promise(async (resolve, reject) => {
      try {
        const resizePath = `uploads/h${height}/${finalFilename}`;

        const jimpImage = await Jimp.read(finalPath);
        await jimpImage
          .resize(Jimp.AUTO, height)
          .quality(100)
          .write(resizePath);

        resolve();
      } catch (error) {
        reject(error); // TODO: reject error
      }
    }));

    await Promise.all(resizePromises);

    return finalFilename;
  }

  // TODO: error handling
  regenerateImages = async (images) => {
    const basePath = 'uploads';

    const allResizePromises = [];
    images.forEach((image) => {
      const imagePath = `${basePath}/${image}`;

      const resizePromises = imagesHeights.map(height => new Promise(async (resolve, reject) => {
        try {
          const finalPath = `${basePath}/h${height}/${image}`;

          const jimpImage = await Jimp.read(imagePath);
          await jimpImage
            .resize(Jimp.AUTO, height)
            .quality(100)
            .write(finalPath);

          resolve();
        } catch (error) {
          reject(error); // TODO
        }
      }));

      allResizePromises.push(...resizePromises);
    });

    await Promise.all(allResizePromises);
  }
}

export default new ImageUpload();
