import mongoose, { mongo } from 'mongoose';

const { Schema } = mongoose;

const RelationSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  direction: {
    type: String,
    enum: ['one-way', 'two-way'],
    required: true,
  },
  type: {
    type: String,
    enum: ['friendship', 'agreement', 'satellite', 'positive'],
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Relation', RelationSchema);
