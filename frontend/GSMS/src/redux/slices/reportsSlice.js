import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const getFabricUsage = createAsyncThunk(
  'reports/getFabricUsage',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/fabric-usage', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch fabric usage data');
    }
  }
);

export const getStockBalance = createAsyncThunk(
  'reports/getStockBalance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/stock-balance', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch stock balance data');
    }
  }
);

export const getOrderFulfillment = createAsyncThunk(
  'reports/getOrderFulfillment',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/order-fulfillment', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch order fulfillment data');
    }
  }
);

export const getWastageAnalysis = createAsyncThunk(
  'reports/getWastageAnalysis',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/wastage-analysis', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch wastage analysis data');
    }
  }
);

export const exportToExcel = createAsyncThunk(
  'reports/exportToExcel',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/export/excel', { 
        params,
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${params.reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to export to Excel');
    }
  }
);

export const exportToPDF = createAsyncThunk(
  'reports/exportToPDF',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/export/pdf', { 
        params,
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${params.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to export to PDF');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    fabricUsage: null,
    stockBalance: null,
    orderFulfillment: null,
    wastageAnalysis: null,
    isLoading: false,
    error: null,
    exportStatus: { loading: false, error: null }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fabric Usage
      .addCase(getFabricUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFabricUsage.fulfilled, (state, action) => {
        state.fabricUsage = action.payload;
        state.isLoading = false;
      })
      .addCase(getFabricUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Stock Balance
      .addCase(getStockBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStockBalance.fulfilled, (state, action) => {
        state.stockBalance = action.payload;
        state.isLoading = false;
      })
      .addCase(getStockBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Order Fulfillment
      .addCase(getOrderFulfillment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderFulfillment.fulfilled, (state, action) => {
        state.orderFulfillment = action.payload;
        state.isLoading = false;
      })
      .addCase(getOrderFulfillment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Wastage Analysis
      .addCase(getWastageAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWastageAnalysis.fulfilled, (state, action) => {
        state.wastageAnalysis = action.payload;
        state.isLoading = false;
      })
      .addCase(getWastageAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Export handlers
      .addCase(exportToExcel.pending, (state) => {
        state.exportStatus.loading = true;
        state.exportStatus.error = null;
      })
      .addCase(exportToExcel.fulfilled, (state) => {
        state.exportStatus.loading = false;
      })
      .addCase(exportToExcel.rejected, (state, action) => {
        state.exportStatus.loading = false;
        state.exportStatus.error = action.payload;
      })
      
      .addCase(exportToPDF.pending, (state) => {
        state.exportStatus.loading = true;
        state.exportStatus.error = null;
      })
      .addCase(exportToPDF.fulfilled, (state) => {
        state.exportStatus.loading = false;
      })
      .addCase(exportToPDF.rejected, (state, action) => {
        state.exportStatus.loading = false;
        state.exportStatus.error = action.payload;
      });
  },
});

export default reportsSlice.reducer; 