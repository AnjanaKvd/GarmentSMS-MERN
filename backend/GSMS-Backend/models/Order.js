const mongoose = require('mongoose');

const consumptionReportSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  materialName: String,
  itemCode: String,
  unit: String,
  requiredQty: {
    type: Number,
    required: true
  },
  actualUsedQty: {
    type: Number,
    default: 0
  },
  standardWastage: {
    type: Number,
    default: 0
  },
  extraWastage: {
    type: Number,
    default: 0
  },
  wastage: {
    type: Number,
    default: 0
  },
  wastePercentage: {
    type: String,
    default: '0.00'
  }
});

const orderSchema = new mongoose.Schema({
  poNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "PRODUCING", "COMPLETED"],
    default: "PENDING"
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  consumptionReport: [consumptionReportSchema]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema); 