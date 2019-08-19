import fs from 'fs';
import { v4 } from 'uuid';
import sharp from 'sharp';

// TODO: File validation
class ImageUpload {
  upload = async (file, resize = true, resizeWidth = 200, resizeHeight = 200) => {
    const {
      path,
      originalname,
    } = file;

    const finalFilename = `${v4()};${originalname}`;
    const finalPath = `uploads/${finalFilename}`;

    if (resize) {
      await sharp(path)
        .resize(resizeWidth, resizeHeight, {
          fit: sharp.fit.contain,
        })
        .toFile(finalPath);
    } else {
      await fs.promises.rename(path, finalPath);
    }

    return finalFilename;
  }
}

export default new ImageUpload();
