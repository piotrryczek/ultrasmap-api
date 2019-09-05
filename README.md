# FanaticsMap

The application visualizes relationships between supporters of sports teams and allows logged in users to suggest changes to existing clubs or to suggest adding a new club.

piotrryczek@gmail.com

- API https://github.com/piotrryczek/ultrasmap-api
- Admin https://github.com/piotrryczek/ultrasmap-admin
- Frontend https://github.com/piotrryczek/ultrasmap-front

## FanaticsMap: API
REST style API for both admin and frontend part of the app.

- Demo: http://ultrasmap-demo.nero12.usermd.net
- Developer: http://ultrasmap-dev.nero12.usermd.net
- Production: https://ultrasmap-prod.nero12.usermd.net

### Build
MongoDB database required.

Configure .env files.

Required folders structure:
```
/logs
/uploads
/backups
/temp
/locales
```

Commands to fire:

```
npm install
npm run build-{env}
```
(env: dev / prod / demo)

Check status endpoint:

`/app/status`

### Main dependencies
- [koa](https://github.com/koajs/koa "koa")
- [koa-multer](https://github.com/koa-modules/multer "koa-multer")
- [koa-router](https://github.com/ZijianHe/koa-router "koa-router")
- [koa-static](https://github.com/koajs/static "koa-static")
- [dotenv](https://www.npmjs.com/package/dotenv "dotenv")
- [mongoose](https://github.com/Automattic/mongoose "mongoose")
- [md5](https://github.com/blueimp/JavaScript-MD5 "md5")
- [jimp](https://github.com/oliver-moran/jimp "jimp")
- [node-cron](https://github.com/kelektiv/node-cron "node-cron")
- [nodemailer](https://github.com/nodemailer/nodemailer "nodemailer")
- [supertest](https://github.com/visionmedia/supertest "supertest")
- [uuid](https://github.com/kelektiv/node-uuid "uuid")
- [winston](https://github.com/winstonjs/winston "winston")
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken "jsonwebtoken")
- [jest](https://github.com/facebook/jest "jest")
- [lodash](https://github.com/lodash/lodash "lodash")

### Environments
- Localhost (.env)
- Production (production.env)
- Developer (developer.env)
- Demo (demo.env)

### Main features
- JWT authorization
- Credentials system
- Uploads with resize & cropping into desired dimensions
- Edit / remove / add club(s) synchronisation relations mechanism prohibiting from duplicating or losing it's mutuality
- CRON for automatic backups and suggestions summary being send on email to moderators
- CORS limited
- Logging moderators and admins actions into activities
- Backups creating and restoring functionality
- Email sender
- Mocking data (disabled on production)
- Basic internationalization for emails