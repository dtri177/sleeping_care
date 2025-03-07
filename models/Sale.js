const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String,enum: ['scan QR'],default:'scan QR', required: true },
    status: { type: String, enum: ['pending','completed', 'returned', 'cancelled'], required: true },
    orderCode : {type: String, required: true}
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);