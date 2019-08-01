import mongoose from 'mongoose';

import '@models/activity';
import '@models/club';
import '@models/role';
import '@models/suggestion';
import '@models/user';

const dbName = process.env.DATABASE_NAME;

mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

export default mongoose.connection;
