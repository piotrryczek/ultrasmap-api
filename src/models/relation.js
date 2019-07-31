import mongoose, { mongo } from 'mongoose';

const { Schema } = mongoose;

const RelationSchema = new Schema({
  _from: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  _to: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  direction: {
    type: String,
    enum: ['one-way', 'two-way'],
  },
  type: {
    type: String,
    enum: ['friendship', 'agreement', 'satellite', 'positive', 'hostility'],
  },
}, {
  timestamps: true,
});

export default mongoose.model('Relation', RelationSchema);
