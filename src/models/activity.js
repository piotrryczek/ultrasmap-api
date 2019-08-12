import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivitySchema = new Schema({

}, {
  timestamps: true,
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
