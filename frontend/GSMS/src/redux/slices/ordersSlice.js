import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk for fetching all completed orders
export const getAllCompletedOrders = createAsyncThunk(
  'orders/fetchCompletedOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/completed');
      
      // Add id property to each order if only _id exists
      if (Array.isArray(response.data)) {
        return response.data.map(order => ({
          ...order,
          id: order._id || order.id,
          // Ensure poNo exists for the dropdown
          poNo: order.poNo || 'N/A',
          customerName: order.customerId?.name || 'N/A'
        }));
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch completed orders'
      );
    }
  }
);

const initialState = {
  completedOrders: [],
  loading: false,
  error: null
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCompletedOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCompletedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.completedOrders = action.payload || [];
      })
      .addCase(getAllCompletedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch completed orders';
      });
  }
});

export const { clearOrdersError } = ordersSlice.actions;

export default ordersSlice.reducer;