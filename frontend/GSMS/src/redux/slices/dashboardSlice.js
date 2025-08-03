import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const [materialsResponse, ordersResponse] = await Promise.all([
        api.get('/materials'),
        api.get('/orders')
      ]);

      const materials = materialsResponse.data || [];
      const orders = ordersResponse.data || [];

      // Calculate statistics
      const totalRawMaterials = materials.length;
      const lowStockMaterials = materials.filter(m => m.currentStock <= 0).length;
      
      const activePurchaseOrders = orders.filter(
        order => order.status === 'PENDING' || order.status === 'PRODUCING'
      ).length;
      
      // Prepare recent materials
      const recentMaterials = [...materials]
        .sort((a, b) => new Date(b.updatedDate || b.createdAt) - new Date(a.updatedDate || a.createdAt))
        .slice(0, 5)
        .map(material => ({
          id: material._id,
          itemCode: material.itemCode,
          name: material.name,
          currentStock: material.currentStock,
          unit: material.unit,
          updatedDate: material.updatedDate || material.createdAt
        }));

      // Prepare recent orders
      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5)
        .map(order => ({
          id: order._id,
          poNo: order.poNo,
          productName: order.productId?.itemName || 'N/A',
          styleNo: order.productId?.styleNo || 'N/A',
          quantity: order.quantity,
          status: order.status,
          orderDate: order.orderDate
        }));

      // Calculate order status distribution
      const orderStatusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, { COMPLETED: 0, PRODUCING: 0, PENDING: 0, CANCELLED: 0 });

      return {
        totalRawMaterials,
        lowStockMaterials,
        activePurchaseOrders,
        recentMaterials,
        recentOrders,
        orderStatusCounts,
        totalOrders: orders.length
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      lowStockMaterials: 0,
      activePurchaseOrders: 0,
      totalOrders: 0,
      recentMaterials: [],
      recentOrders: [],
      orderStatusCounts: {
        COMPLETED: 0,
        PRODUCING: 0,
        PENDING: 0,
        CANCELLED: 0
      }
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