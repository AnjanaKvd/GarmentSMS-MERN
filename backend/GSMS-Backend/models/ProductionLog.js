const mongoose = require('mongoose');

const productionLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  cutQty: {
    type: Number,
    required: true
  },
  usedFabric: {
    type: Number,
    required: true
  },
  wastageQty: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('ProductionLog', productionLogSchema); 