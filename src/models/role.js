import mongoose from 'mongoose';

const { Schema } = mongoose;

const RoleSchema = new Schema({
  name: String,
  credentials: [String],
}, {
  timestamps: true,
});

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
