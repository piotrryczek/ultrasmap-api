import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalObject: {
    type: Schema.Types.ObjectId,
  },
  originalObjectName: {
    type: Schema.Types.String,
  },
  objectType: {
    type: String,
    enum: [
      'club',
      'user',
      'suggestion',
    ],
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      'add',
      'remove',
      'update',
      'apply', // suggestion
    ],
    required: true,
  },
  before: {
    type: Schema.Types.Mixed,
  },
  after: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
