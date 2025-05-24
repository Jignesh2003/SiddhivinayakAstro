import mongoose from 'mongoose';

const dailyAstrologySchema = new mongoose.Schema({
  zodiacSign: {
    type: String,
    required: true,
    unique: true, // Ensure only one document per zodiac sign
    enum: [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ]
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

export default mongoose.model('DailyAstrology', dailyAstrologySchema);
