import mongoose from 'mongoose';

const { Schema } = mongoose;

const MatchSchema = new Schema({
  homeClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  unimportantHomeClubName: {
    type: Schema.Types.String,
  },
  awayClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
  },
  unimportantAwayClubName: {
    type: Schema.Types.String,
  },
  isHomeClubReserve: {
    type: Schema.Types.Boolean,
    default: false,
  },
  isAwayClubReserve: {
    type: Schema.Types.Boolean,
    default: false,
  },
  league: {
    type: Schema.Types.ObjectId,
    ref: 'League',
  },
  attitude: {
    type: Schema.Types.Mixed,
  },
  importance: {
    type: Schema.Types.Number,
  },
  attitudeEstimationLevel: {
    type: Schema.Types.Number,
  },
  additional: [Schema.Types.String],
  date: {
    type: Schema.Types.Date,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
    },
  },
  isVisible: {
    type: Schema.Types.Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.MatchSchema || mongoose.model('Match', MatchSchema);
