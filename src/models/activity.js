import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivitySchema = new Schema({

}, {
  timestamps: true,
});

export default mongoose.model('Activity', ActivitySchema);
