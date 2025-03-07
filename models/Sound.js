const mongoose = require('mongoose');


const SoundSchema = new mongoose.Schema({
    is_premium: { type: Boolean, default: false },
    soundId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    preview: { type: String, default: null },
    images: { type: String, default: null },
    duration: { type: Number, required: true },
    tags: { type: [String] }
}, {timestamps: true})


module.exports = mongoose.model('Sound', SoundSchema);