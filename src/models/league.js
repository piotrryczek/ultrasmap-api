import mongoose from 'mongoose';

const { Schema } = mongoose;

const LeagueSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country',
  },
  downloadMethod: {
    type: Schema.Types.String,
    enum: ['90minut'],
  },
  downloadUrl: {
    type: Schema.Types.String,
  },
  clubs: [{
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  }],
  importanceModifier: {
    type: Schema.Types.Number,
    default: 1,
  },
  sport: {
    type: Schema.Types.String,
    enum: ['football'],
  },
  tier: {
    type: Schema.Types.Number,
  },
  isAutomaticDownload: {
    type: Schema.Types.Boolean,
    default: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.League || mongoose.model('League', LeagueSchema);
