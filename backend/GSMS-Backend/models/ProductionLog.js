const mongoose = require('mongoose');

const productionLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  cutQty: {
    type: Number,
    required: true
  },
  // Materials used in this production log
  materialUsage: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
      required: true
    },
    usedQty: {
      type: Number,
      default: 0
    },
    // Standard wastage based on BOM calculations
    standardWastage: {
      type: Number,
      default: 0
    },
    // Extra wastage recorded during production
    extraWastage: {
      type: Number,
      default: 0
    },
    // Total wastage (standardWastage + extraWastage)
    totalWastage: {
      type: Number,
      default: 0
    },
    // Wastage reason for reporting and analysis
    wastageReason: {
      type: String,
      default: ''
    }
  }],
  isExtraWastageOnly: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['CUTTING', 'SEWING', 'FINISHING', 'COMPLETED'],
    default: 'CUTTING'
  },
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Pre-save middleware to calculate total wastage
productionLogSchema.pre('save', function(next) {
  this.materialUsage.forEach(material => {
    material.totalWastage = (material.standardWastage || 0) + (material.extraWastage || 0);
  });
  next();
});

module.exports = mongoose.model('ProductionLog', productionLogSchema); 