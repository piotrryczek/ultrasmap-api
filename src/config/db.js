import mongoose from 'mongoose';

import '@models/activity';
import '@models/club';
import '@models/role';
import '@models/suggestion';
import '@models/user';

const connectionUrl = process.env.MONGO_CONNECTION;

console.log(connectionUrl);

mongoose.connect(connectionUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

export default mongoose.connection;
