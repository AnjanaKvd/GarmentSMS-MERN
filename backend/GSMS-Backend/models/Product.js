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
  materialsRequired: [materialRequirementSchema],
  wastageRemarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 