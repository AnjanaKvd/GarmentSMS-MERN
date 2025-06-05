import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeId } from '../../utils/apiHelpers';

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll simulate the API call with a timeout
      const [materialsResponse, productsResponse, ordersResponse, productionResponse] = await Promise.all([
        api.get('/materials'),
        api.get('/products'),
        api.get('/orders'),
        api.get('/production')
      ]);

      // Calculate statistics from the responses
      const totalRawMaterials = materialsResponse.data.length;
      
      // Calculate in-stock balance (sum of all material quantities)
      const inStockBalance = materialsResponse.data.reduce(
        (total, material) => total + (material.quantity || 0),
        0
      );
      
      // Count active purchase orders
      const activePurchaseOrders = ordersResponse.data.filter(
        order => order.status === 'PENDING' || order.status === 'PROCESSING'
      ).length;
      
      // Get upcoming deliveries (orders with status SHIPPED)
      const upcomingDeliveries = ordersResponse.data.filter(
        order => order.status === 'COMPLETED'
      ).length;
      
      // Get recent material entries
      const recentEntries = materialsResponse.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(material => ({
          id: material._id || material.id,
          material: material.name,
          quantity: material.quantity,
          date: new Date(material.createdAt).toISOString().split('T')[0]
        }));

      // Get top products
      const topProducts = productsResponse.data
        .slice(0, 5)
        .map(product => ({
          id: product._id || product.id,
          name: product.name,
          styleNo: product.styleNo,
          category: product.category
        }));

      // Get recent production activities
      const recentProduction = productionResponse.data
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(log => ({
          id: log._id || log.id,
          product: log.productName || 'Unknown Product',
          quantity: log.quantity,
          date: new Date(log.date).toISOString().split('T')[0]
        }));

      return {
        totalRawMaterials,
        inStockBalance,
        activePurchaseOrders,
        upcomingDeliveries,
        recentEntries,
        topProducts,
        recentProduction
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard statistics'
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      totalRawMaterials: 0,
      inStockBalance: 0,
      activePurchaseOrders: 0,
      upcomingDeliveries: 0,
      recentEntries: [],
      topProducts: [],
      recentProduction: []
    },
    isLoading: false,
    error: null
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard statistics';
      });
  }
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;