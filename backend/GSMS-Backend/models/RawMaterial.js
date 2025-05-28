const mongoose = require('mongoose');

const receivedBatchSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  remarks: String
});

const rawMaterialSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    required: true,
    enum: ["m", "kg", "pcs", "yd"]
  },
  currentStock: {
    type: Number,
    default: 0
  },
  receivedBatches: [receivedBatchSchema],
  updatedDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema); 