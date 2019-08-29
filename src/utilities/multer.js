import multer from 'koa-multer';

export default multer({ dest: `${process.cwd()}/temp` });
