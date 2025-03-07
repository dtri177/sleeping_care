const mongoose = require('mongoose');
const favoriteSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    sound: { type: mongoose.Schema.Types.ObjectId, ref: 'Sound', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
  
});
favoriteSchema.index({ user: 1, sound: 1 }, { unique: true });
module.exports = mongoose.model('Favorite', favoriteSchema);