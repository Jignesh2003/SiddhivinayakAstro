// models/NumerologyProfile.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const NumerologyProfileSchema = new Schema({
  number:      { type: Number, required: true },
  type:        { type: String,  required: true, enum: [
    'life_path','expression','soul_urge','birthday'
    // extend: 'personality','maturity','balance', …
  ]},
  title:       String,
  description: String,
  traits: {
    positive: [String],
    negative: [String]
  },
  compatibility: {
    compatible_with: [Number],
    challenging_with: [Number]
  }
}, { timestamps: true });

export default model('NumerologyProfile', NumerologyProfileSchema);
