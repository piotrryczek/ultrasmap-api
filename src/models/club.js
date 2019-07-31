import mongoose from 'mongoose';

const { Schema } = mongoose;

const ClubSchema = new Schema({
  name: String,
  logo: String,
  tier: Number,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Club', ClubSchema);
