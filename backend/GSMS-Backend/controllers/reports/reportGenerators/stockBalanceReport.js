const RawMaterial = require('../../../models/RawMaterial');
const Order = require('../../../models/Order');
const mongoose = require('mongoose');

/**
 * Generate stock balance report data with IN/OUT logs
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data with IN/OUT transactions and summary
 */
async function generateStockBalanceReport(filters = {}) {
    const { 
        materialId, 
        category, 
        status, 
        lowStockOnly, 
        startDate, 
        endDate 
    } = filters;
    
    try {
        // Build material query
        const materialQuery = {};
        
        if (materialId) {
            materialQuery._id = materialId;
        }
        
        if (category) {
            materialQuery.category = category;
        }
        
        if (status) {
            materialQuery.status = status;
        }
        
        // Build order query for material usage
        const orderQuery = { status: 'COMPLETED' };
        
        if (startDate || endDate) {
            orderQuery.completedDate = {};
            if (startDate) orderQuery.completedDate.$gte = new Date(startDate);
            if (endDate) orderQuery.completedDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
        
        // Fetch all materials with received batches
        const materials = await RawMaterial.find(materialQuery)
            .select('name itemCode unit currentStock reorderLevel category status receivedBatches')
            .lean();
        
        // Get material IDs for order query
        const materialIds = materials.map(m => m._id);
        
        // Fetch completed orders with consumption reports for these materials
        const orders = await Order.find({
            ...orderQuery,
            'consumptionReport.materialId': { $in: materialIds }
        })
            .select('poNo completedDate consumptionReport')
            .populate('productId', 'itemName styleNo')
            .lean();
        
        // Process each material
        const processedMaterials = await Promise.all(materials.map(async (material) => {
            // Process IN transactions (received batches)
            const inTransactions = material.receivedBatches
                .filter(batch => {
                    if (!startDate && !endDate) return true;
                    const batchDate = new Date(batch.receivedDate);
                    return (!startDate || batchDate >= new Date(startDate)) && 
                           (!endDate || batchDate <= new Date(`${endDate}T23:59:59.999Z`));
                })
                .map(batch => ({
                    type: 'IN',
                    date: batch.receivedDate,
                    quantity: batch.quantity,
                    reference: 'Stock Receipt',
                    remarks: batch.remarks || ''
                }));
            
            // Calculate total received quantity
            const totalReceived = inTransactions.reduce((sum, t) => sum + t.quantity, 0);
            
            // Process OUT transactions (material usage in orders)
            const materialOrders = orders.filter(order => 
                order.consumptionReport.some(cr => 
                    cr.materialId && cr.materialId._id && 
                    cr.materialId._id.toString() === material._id.toString()
                )
            );
            
            const outTransactions = [];
            let totalUsed = 0;
            
            materialOrders.forEach(order => {
                const consumption = order.consumptionReport.find(cr => 
                    cr.materialId && cr.materialId._id && 
                    cr.materialId._id.toString() === material._id.toString()
                );
                
                if (consumption) {
                    const quantity = consumption.actualUsedQty || 0;
                    outTransactions.push({
                        type: 'OUT',
                        date: order.completedDate,
                        quantity,
                        reference: `Order: ${order.poNo}`,
                        product: order.productId?.itemName || 'N/A'
                    });
                    totalUsed += quantity;
                }
            });
            
            // Combine and sort all transactions by date
            const transactions = [...inTransactions, ...outTransactions]
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate opening balance (stock before start date if date range is provided)
            let openingBalance = 0;
            
            if (startDate) {
                // Calculate stock before start date
                const openingIn = material.receivedBatches
                    .filter(batch => new Date(batch.receivedDate) < new Date(startDate))
                    .reduce((sum, batch) => sum + batch.quantity, 0);
                
                const openingOut = (await Order.aggregate([
                    {
                        $match: {
                            status: 'COMPLETED',
                            'consumptionReport.materialId': material._id,
                            completedDate: { $lt: new Date(startDate) }
                        }
                    },
                    { $unwind: '$consumptionReport' },
                    {
                        $match: {
                            'consumptionReport.materialId': material._id
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$consumptionReport.actualUsedQty' }
                        }
                    }
                ]))[0]?.total || 0;
                
                openingBalance = Math.max(0, openingIn - openingOut);
            }
            
            // Calculate closing balance
            const closingBalance = openingBalance + totalReceived - totalUsed;
            
            // Determine stock status
            let stockStatus = 'In Stock';
            if (closingBalance <= 0) {
                stockStatus = 'Out of Stock';
            } else if (material.reorderLevel && closingBalance <= material.reorderLevel) {
                stockStatus = 'Low Stock';
            }
            
            return {
                ...material,
                status: stockStatus,
                openingBalance,
                received: totalReceived,
                issued: totalUsed,
                closingBalance,
                reorderLevel: material.reorderLevel || 0,
                transactions,
                transactionCount: transactions.length,
                lastTransaction: transactions.length > 0 ? 
                    new Date(Math.max(...transactions.map(t => new Date(t.date)))) : 
                    null
            };
        }));
        
        // Calculate summary statistics
        const totalItems = processedMaterials.length;
        const totalOpening = processedMaterials.reduce((sum, m) => sum + m.openingBalance, 0);
        const totalReceived = processedMaterials.reduce((sum, m) => sum + m.received, 0);
        const totalIssued = processedMaterials.reduce((sum, m) => sum + m.issued, 0);
        const totalClosing = processedMaterials.reduce((sum, m) => sum + m.closingBalance, 0);
        
        const lowStockItems = processedMaterials.filter(m => m.status === 'Low Stock').length;
        const outOfStockItems = processedMaterials.filter(m => m.status === 'Out of Stock').length;
        const inStockItems = totalItems - outOfStockItems - lowStockItems;
        
        // Filter materials if low stock only is requested
        const filterLowStock = lowStockOnly === 'true' || lowStockOnly === true;
        const filteredMaterials = filterLowStock 
            ? processedMaterials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock')
            : processedMaterials;
            
        console.log('Filtering materials:', {
            lowStockOnly,
            filterLowStock,
            totalMaterials: processedMaterials.length,
            filteredCount: filteredMaterials.length,
            sampleStatuses: processedMaterials.slice(0, 3).map(m => m.status)
        });
        
        // Sort materials by name by default
        filteredMaterials.sort((a, b) => a.name.localeCompare(b.name));
        
        // Prepare summary
        const summary = {
            totalItems,
            totalOpening,
            totalReceived,
            totalIssued,
            totalClosing,
            lowStockItems,
            outOfStockItems,
            inStockItems,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`) : null,
            generatedAt: new Date()
        };
        
        const result = {
            summary,
            materials: filteredMaterials,
            _debug: {
                filterApplied: filterLowStock,
                totalMaterials: processedMaterials.length,
                filteredMaterials: filteredMaterials.length,
                allStatuses: [...new Set(processedMaterials.map(m => m.status))]
            }
        };
        
        console.log('Generated report data:', {
            summary: {
                totalItems: summary.totalItems,
                inStock: summary.inStockItems,
                lowStock: summary.lowStockItems,
                outOfStock: summary.outOfStockItems
            },
            materialsCount: filteredMaterials.length,
            sampleMaterials: filteredMaterials.slice(0, 2).map(m => ({
                name: m.name,
                status: m.status,
                closingBalance: m.closingBalance,
                reorderLevel: m.reorderLevel
            }))
        });
        
        return result;
        
    } catch (error) {
        console.error('Error generating stock balance report:', error);
        throw new Error(`Failed to generate stock balance report: ${error.message}`);
    }
}

module.exports = { generateStockBalanceReport };
