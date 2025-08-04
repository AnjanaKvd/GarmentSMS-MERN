const mongoose = require('mongoose');

const materialRequirementSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  quantityPerPiece: {
    type: Number,
    required: true
  },
  expectedWastagePercentage: {
    type: Number,
    default: 0
  },
  wastageRemarks: {
    type: String,
    default: ''
  }
});

const productSchema = new mongoose.Schema({
  styleNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  materialsRequired: [materialRequirementSchema],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 