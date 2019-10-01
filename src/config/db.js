import mongoose from 'mongoose';

import '@models/activity';
import '@models/club';
import '@models/role';
import '@models/suggestion';
import '@models/user';
import '@models/match';
import '@models/league';
import '@models/country';


const connectionUrl = process.env.MONGO_CONNECTION;

mongoose.connect(connectionUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

export default mongoose.connection;
