import mongoose from 'mongoose';

const { Schema } = mongoose;

const RoleSchema = new Schema({
  name: String,
  credentials: [String],
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
