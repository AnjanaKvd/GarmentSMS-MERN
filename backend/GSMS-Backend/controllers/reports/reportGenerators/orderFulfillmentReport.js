const Order = require('../../../models/Order');
const Product = require('../../../models/Product');

/**
 * Generate order fulfillment report data
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Report data
 */
async function generateOrderFulfillmentReport(filters = {}) {
    const { 
        status, 
        startDate, 
        endDate, 
        productId,
        customerId
    } = filters;
    
    // Build the query
    const query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (productId) {
        query.productId = productId;
    }
    
    if (customerId) {
        query.customerId = customerId;
    }
    
    if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) {
            query.orderDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.orderDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
    }
    
    try {
        // Fetch orders with product details
        const orders = await Order.find(query)
            .populate('productId', 'itemName styleNo')
            .populate('customerId', 'name')
            .sort({ orderDate: -1 })
            .lean();
        
        // Calculate summary statistics
        let totalOrders = 0;
        let completedOrders = 0;
        let inProgressOrders = 0;
        let notStartedOrders = 0;
        let totalQuantity = 0;
        let completedQuantity = 0;
        
        // Process each order
        const processedOrders = orders.map(order => {
            totalOrders++;
            totalQuantity += order.quantity || 0;
            
            let status = order.status || 'Not Started';
            let completionPercentage = 0;
            let completed = 0;
            let pending = order.quantity || 0;
            
            // Calculate completion based on status and production progress
            if (status === 'COMPLETED') {
                completionPercentage = 100;
                completed = order.quantity || 0;
                pending = 0;
                completedOrders++;
                completedQuantity += completed;
            } else if (status === 'IN_PROGRESS' || status === 'PRODUCTION') {
                // In a real system, this would come from production logs
                const progress = order.productionProgress || 0;
                completionPercentage = Math.min(Math.max(progress, 0), 100);
                completed = Math.floor((order.quantity * completionPercentage) / 100);
                pending = Math.max(0, (order.quantity || 0) - completed);
                inProgressOrders++;
            } else {
                notStartedOrders++;
                pending = order.quantity || 0;
            }
            
            return {
                _id: order._id,
                poNo: order.poNo,
                productId: order.productId?._id,
                productName: order.productId?.itemName || 'N/A',
                styleNo: order.productId?.styleNo || 'N/A',
                customerName: order.customerId?.name || 'N/A',
                orderDate: order.orderDate,
                dueDate: order.dueDate,
                quantity: order.quantity,
                status: formatStatus(status),
                completed,
                pending,
                completionPercentage
            };
        });
        
        // Calculate overall completion rate
        const completionRate = totalQuantity > 0 
            ? Math.round((completedQuantity / totalQuantity) * 100) 
            : 0;
        
        // Prepare summary
        const summary = {
            totalOrders,
            completedOrders,
            inProgress: inProgressOrders,
            notStarted: notStartedOrders,
            totalQuantity,
            completedQuantity,
            pendingQuantity: totalQuantity - completedQuantity,
            completionRate,
            generatedAt: new Date(),
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`) : null
        };
        
        return {
            summary,
            orders: processedOrders
        };
        
    } catch (error) {
        console.error('Error generating order fulfillment report:', error);
        throw new Error(`Failed to generate order fulfillment report: ${error.message}`);
    }
}

/**
 * Format order status for display
 * @param {string} status - Order status
 * @returns {string} Formatted status
 */
function formatStatus(status) {
    if (!status) return 'Not Started';
    
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

module.exports = { generateOrderFulfillmentReport };
