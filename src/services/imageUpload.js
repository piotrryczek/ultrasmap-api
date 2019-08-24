import fs from 'fs';
import { v4 } from 'uuid';
import sharp from 'sharp';

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

        await sharp(finalPath)
          .resize(null, height, {
            fit: sharp.fit.contain,
          })
          .toFile(resizePath);

        resolve();
      } catch (error) {
        reject(error); // TODO
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

          await sharp(imagePath)
            .resize(null, height, {
              fit: sharp.fit.contain,
            })
            .toFile(finalPath);

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
