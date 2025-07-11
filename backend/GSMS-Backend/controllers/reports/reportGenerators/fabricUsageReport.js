const Order = require('../../../models/Order');

/**
 * Generate fabric usage report data
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data
 */
async function generateFabricUsageReport(filters = {}) {
    const { orderId, materialId, startDate, endDate } = filters;
    
    // Build the query
    const query = { status: 'COMPLETED' };
    
    if (orderId) {
        query._id = orderId;
    }
    
    if (startDate || endDate) {
        query.completedDate = {};
        if (startDate) {
            query.completedDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.completedDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
    }
    
    try {
        // Fetch orders with consumption reports and material details
        const orders = await Order.find(query)
            .populate({
                path: 'consumptionReport.materialId',
                select: 'name itemCode unit'
            })
            .populate('productId', 'itemName styleNo');
        
        // Initialize data structures
        const materialUsageMap = new Map();
        let totalUsage = 0;
        let totalWastage = 0;
        
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
                
                // Skip if filtering by materialId and it doesn't match
                if (materialId && materialId !== materialId) return;
                
                // Initialize material entry if it doesn't exist
                if (!materialUsageMap.has(materialId)) {
                    materialUsageMap.set(materialId, {
                        materialId: entry.materialId._id,
                        name: entry.materialId.name,
                        itemCode: entry.materialId.itemCode,
                        unit: entry.materialId.unit,
                        totalUsage: 0,
                        totalWastage: 0,
                        orderUsage: [],
                        dateUsage: []
                    });
                }
                
                const material = materialUsageMap.get(materialId);
                
                // Update totals
                material.totalUsage += usage;
                material.totalWastage += wastage;
                totalUsage += usage;
                totalWastage += wastage;
                
                // Add order usage
                material.orderUsage.push({
                    orderId: order._id,
                    poNo: order.poNo,
                    productName: order.productId?.itemName || 'N/A',
                    styleNo: order.productId?.styleNo || 'N/A',
                    usage,
                    wastage,
                    date: order.completedDate
                });
                
                // Group by date
                const dateKey = order.completedDate?.toISOString().split('T')[0] || 'Unknown';
                const dateEntry = material.dateUsage.find(d => d.date === dateKey);
                
                if (dateEntry) {
                    dateEntry.usage += usage;
                    dateEntry.wastage += wastage;
                } else {
                    material.dateUsage.push({
                        date: dateKey,
                        usage,
                        wastage
                    });
                }
            });
        });
        
        // Convert map to array and calculate percentages
        const materials = Array.from(materialUsageMap.values()).map(material => ({
            ...material,
            wastePercentage: material.totalUsage > 0 
                ? (material.totalWastage / material.totalUsage) * 100 
                : 0,
            orderUsage: material.orderUsage.sort((a, b) => 
                new Date(b.date || 0) - new Date(a.date || 0)
            ),
            dateUsage: material.dateUsage.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )
        }));
        
        // Sort materials by total wastage (descending)
        materials.sort((a, b) => b.totalWastage - a.totalWastage);
        
        // Prepare summary
        const summary = {
            totalMaterials: materials.length,
            totalOrders: orders.length,
            totalUsage,
            totalWastage,
            totalWastePercentage: totalUsage > 0 ? (totalWastage / totalUsage) * 100 : 0,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`) : null
        };
        
        return {
            summary,
            materials
        };
        
    } catch (error) {
        console.error('Error generating fabric usage report:', error);
        throw new Error(`Failed to generate fabric usage report: ${error.message}`);
    }
}

module.exports = { generateFabricUsageReport };
