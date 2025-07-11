const Order = require('../../../models/Order');
const RawMaterial = require('../../../models/RawMaterial');

/**
 * Generate wastage analysis report data
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data
 */
async function generateWastageAnalysisReport(filters = {}) {
    const { 
        materialId, 
        startDate, 
        endDate,
        wastageThreshold 
    } = filters;
    
    // Build the query for completed orders
    const orderQuery = { status: 'COMPLETED' };
    
    if (startDate || endDate) {
        orderQuery.completedDate = {};
        if (startDate) {
            orderQuery.completedDate.$gte = new Date(startDate);
        }
        if (endDate) {
            orderQuery.completedDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
    }
    
    try {
        // Fetch completed orders with consumption reports
        const orders = await Order.find(orderQuery)
            .populate({
                path: 'consumptionReport.materialId',
                select: 'name itemCode unit standardWastage'
            })
            .populate('productId', 'itemName styleNo')
            .lean();
        
        // Initialize data structures
        const materialWastageMap = new Map();
        const wastageReasons = new Map();
        let totalWastage = 0;
        let totalStandardWastage = 0;
        
        // Process each order
        orders.forEach(order => {
            if (!order.consumptionReport || !Array.isArray(order.consumptionReport)) {
                return;
            }
            
            order.consumptionReport.forEach(entry => {
                if (!entry.materialId) return;
                
                const materialId = entry.materialId._id.toString();
                const usage = entry.actualUsedQty || 0;
                const wastage = entry.wastage || 0;
                const standardWastage = entry.standardWastage || 0;
                const extraWastage = Math.max(0, wastage - standardWastage);
                
                // Skip if filtering by materialId and it doesn't match
                if (materialId && materialId !== materialId) return;
                
                // Initialize material entry if it doesn't exist
                if (!materialWastageMap.has(materialId)) {
                    materialWastageMap.set(materialId, {
                        materialId: entry.materialId._id,
                        name: entry.materialId.name,
                        itemCode: entry.materialId.itemCode,
                        unit: entry.materialId.unit,
                        totalUsed: 0,
                        totalWastage: 0,
                        standardWastage: 0,
                        extraWastage: 0,
                        wastagePercentage: 0,
                        orders: []
                    });
                }
                
                const material = materialWastageMap.get(materialId);
                
                // Update totals
                material.totalUsed += usage;
                material.totalWastage += wastage;
                material.standardWastage += standardWastage;
                material.extraWastage += extraWastage;
                totalWastage += wastage;
                totalStandardWastage += standardWastage;
                
                // Add order details
                material.orders.push({
                    orderId: order._id,
                    poNo: order.poNo,
                    productName: order.productId?.itemName || 'N/A',
                    styleNo: order.productId?.styleNo || 'N/A',
                    date: order.completedDate,
                    usage,
                    wastage,
                    standardWastage,
                    extraWastage
                });
                
                // Track wastage reasons if available
                if (entry.wastageReason) {
                    const reason = entry.wastageReason;
                    if (!wastageReasons.has(reason)) {
                        wastageReasons.set(reason, 0);
                    }
                    wastageReasons.set(reason, wastageReasons.get(reason) + wastage);
                }
            });
        });
        
        // Convert map to array and calculate percentages
        const materials = Array.from(materialWastageMap.values()).map(material => {
            const wastagePercentage = material.totalUsed > 0 
                ? (material.totalWastage / material.totalUsed) * 100 
                : 0;
                
            const standardWastagePercentage = material.totalUsed > 0
                ? (material.standardWastage / material.totalUsed) * 100
                : 0;
                
            const extraWastagePercentage = material.totalUsed > 0
                ? (material.extraWastage / material.totalUsed) * 100
                : 0;
                
            // Determine status based on wastage threshold
            let status = 'Normal';
            if (wastageThreshold && wastagePercentage > wastageThreshold) {
                status = 'High';
            } else if (material.extraWastage > 0) {
                status = 'Warning';
            }
            
            return {
                ...material,
                wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
                standardWastagePercentage: parseFloat(standardWastagePercentage.toFixed(2)),
                extraWastagePercentage: parseFloat(extraWastagePercentage.toFixed(2)),
                status
            };
        });
        
        // Sort materials by extra wastage (descending)
        materials.sort((a, b) => b.extraWastage - a.extraWastage);
        
        // Process wastage reasons
        const totalWastageForReasons = Array.from(wastageReasons.values()).reduce((sum, val) => sum + val, 0);
        const processedReasons = Array.from(wastageReasons.entries())
            .map(([reason, amount]) => ({
                reason,
                amount,
                percentage: totalWastageForReasons > 0 
                    ? parseFloat(((amount / totalWastageForReasons) * 100).toFixed(2))
                    : 0
            }))
            .sort((a, b) => b.amount - a.amount);
        
        // Find highest and lowest wastage items
        let highestWastageItem = null;
        let lowestWastageItem = null;
        
        if (materials.length > 0) {
            highestWastageItem = materials[0];
            lowestWastageItem = materials[materials.length - 1];
            
            // Find the actual highest wastage item (not just first in array)
            for (const material of materials) {
                if (material.wastagePercentage > highestWastageItem.wastagePercentage) {
                    highestWastageItem = material;
                }
                if (material.wastagePercentage < lowestWastageItem.wastagePercentage) {
                    lowestWastageItem = material;
                }
            }
        }
        
        // Calculate average wastage percentage
        const averageWastagePercentage = materials.length > 0
            ? materials.reduce((sum, m) => sum + m.wastagePercentage, 0) / materials.length
            : 0;
        
        // Prepare summary
        const summary = {
            totalItems: materials.length,
            totalWastage,
            totalStandardWastage,
            totalExtraWastage: totalWastage - totalStandardWastage,
            averageWastagePercentage: parseFloat(averageWastagePercentage.toFixed(2)),
            highestWastageItem: highestWastageItem ? {
                name: highestWastageItem.name,
                itemCode: highestWastageItem.itemCode,
                wastage: highestWastageItem.totalWastage,
                percentage: highestWastageItem.wastagePercentage
            } : null,
            lowestWastageItem: lowestWastageItem ? {
                name: lowestWastageItem.name,
                itemCode: lowestWastageItem.itemCode,
                wastage: lowestWastageItem.totalWastage,
                percentage: lowestWastageItem.wastagePercentage
            } : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`) : null,
            generatedAt: new Date()
        };
        
        return {
            summary,
            materials,
            wastageReasons: processedReasons
        };
        
    } catch (error) {
        console.error('Error generating wastage analysis report:', error);
        throw new Error(`Failed to generate wastage analysis report: ${error.message}`);
    }
}

module.exports = { generateWastageAnalysisReport };
