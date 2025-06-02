import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeId } from '../../utils/apiHelpers';

// Fetch all production logs
export const fetchProductionLogs = createAsyncThunk(
  'production/fetchLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/production');
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch production logs'
      );
    }
  }
);

// Fetch production logs for specific order
export const fetchOrderProductionLogs = createAsyncThunk(
  'production/fetchOrderLogs',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/production/order/${orderId}`);
      return { orderId, logs: normalizeId(response.data) };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order production logs'
      );
    }
  }
);

// Create production record with wastage
export const createProductionRecord = createAsyncThunk(
  'production/createRecord',
  async (productionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/production', productionData);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create production record'
      );
    }
  }
);

// Update production record
export const updateProductionRecord = createAsyncThunk(
  'production/updateRecord',
  async ({ id, productionData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/production/${id}`, productionData);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update production record'
      );
    }
  }
);

// Delete production record
export const deleteProductionRecord = createAsyncThunk(
  'production/deleteRecord',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/production/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete production record'
      );
    }
  }
);

// Get wastage analysis
export const getWastageAnalysis = createAsyncThunk(
  'production/getWastageAnalysis',
  async (params, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/production/wastage-analysis?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wastage analysis'
      );
    }
  }
);

// Add extra wastage for order
export const addExtraWastage = createAsyncThunk(
  'production/addExtraWastage',
  async (wastageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/production/extra-wastage', wastageData);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add extra wastage'
      );
    }
  }
);

// Get order usage with wastage details
export const getOrderUsageWithWastage = createAsyncThunk(
  'production/getOrderUsage',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${orderId}/usage`);
      return { orderId, usage: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order usage'
      );
    }
  }
);

const initialState = {
  productionLogs: [],
  orderLogs: {},
  orderUsage: {},
  currentLog: null,
  wastageAnalysis: null,
  isLoading: false,
  error: null,
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    clearProductionError: (state) => {
      state.error = null;
    },
    clearCurrentLog: (state) => {
      state.currentLog = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all logs
      .addCase(fetchProductionLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductionLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productionLogs = action.payload;
      })
      .addCase(fetchProductionLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch order logs
      .addCase(fetchOrderProductionLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderProductionLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderLogs[action.payload.orderId] = action.payload.logs;
      })
      .addCase(fetchOrderProductionLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create record
      .addCase(createProductionRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProductionRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productionLogs.push(action.payload);
        state.currentLog = action.payload;
      })
      .addCase(createProductionRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update record
      .addCase(updateProductionRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProductionRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.productionLogs.findIndex(
          (log) => (log.id || log._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.productionLogs[index] = action.payload;
        }
        state.currentLog = action.payload;
      })
      .addCase(updateProductionRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete record
      .addCase(deleteProductionRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProductionRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productionLogs = state.productionLogs.filter(
          (log) => (log.id || log._id) !== action.payload
        );
        state.currentLog = null;
      })
      .addCase(deleteProductionRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Wastage analysis
      .addCase(getWastageAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWastageAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wastageAnalysis = action.payload;
      })
      .addCase(getWastageAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add extra wastage
      .addCase(addExtraWastage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addExtraWastage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productionLogs.push(action.payload);
        state.currentLog = action.payload;
      })
      .addCase(addExtraWastage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get order usage
      .addCase(getOrderUsageWithWastage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderUsageWithWastage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderUsage[action.payload.orderId] = action.payload.usage;
      })
      .addCase(getOrderUsageWithWastage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
  },
});

export const { clearProductionError, clearCurrentLog } = productionSlice.actions;
export default productionSlice.reducer;
