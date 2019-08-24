import Router from 'koa-router';

import UploadsController from '@controllers/uploadsController';
import { retrieveUser, hasCredential } from '@utilities/middlewares';
import upload from '@utilities/multer';

const router = new Router({ prefix: '/uploads' });

router.post(
  '/',
  retrieveUser,
  hasCredential('uploadFile'),
  upload.single('file'),
  UploadsController.upload,
);

router.post(
  '/regenerateImages',
  retrieveUser,
  hasCredential('regenerateImages'),
  UploadsController.regenerateImageSizes,
);

export default router;
