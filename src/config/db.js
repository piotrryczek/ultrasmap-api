import mongoose from 'mongoose';

import '@models/activity';
import '@models/club';
import '@models/relation';
import '@models/role';
import '@models/suggestion';
import '@models/user';

mongoose.connect('mongodb://localhost:27017/ultrasmap', {
  useNewUrlParser: true,
  useCreateIndex: true,
});

export default mongoose.connection;
