import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeId } from '../../utils/apiHelpers';

// Fetch all materials
export const fetchMaterials = createAsyncThunk(
  'materials/fetchMaterials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/materials');
      
      // Add id property to each item if only _id exists
      if (Array.isArray(response.data)) {
        response.data = response.data.map(item => {
          if (item._id && !item.id) {
            return { ...item, id: item._id };
          }
          return item;
        });
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch materials'
      );
    }
  }
);

// Fetch a single material with details
export const fetchMaterialById = createAsyncThunk(
  'materials/fetchMaterialById',
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid material ID');
      }
      console.log("Fetching material with ID:", id);
      const response = await api.get(`/materials/${id}`);
      
      // Add id property if only _id exists
      if (response.data && response.data._id && !response.data.id) {
        response.data.id = response.data._id;
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching material:", error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch material details'
      );
    }
  }
);

// Create new material
export const createMaterial = createAsyncThunk(
  'materials/createMaterial',
  async (materialData, { rejectWithValue }) => {
    try {
      const response = await api.post('/materials', materialData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create material'
      );
    }
  }
);

// Update material
export const updateMaterial = createAsyncThunk(
  'materials/updateMaterial',
  async ({ id, materialData }, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid material ID');
      }
      console.log("Updating material with ID:", id);
      const response = await api.put(`/materials/${id}`, materialData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update material'
      );
    }
  }
);

// Receive new stock
export const receiveMaterialStock = createAsyncThunk(
  'materials/receiveMaterialStock',
  async ({ id, stockData }, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid material ID');
      }
      console.log("Receiving stock for material with ID:", id);
      
      // Prepare the data for the API
      const apiData = {
        quantity: stockData.quantity,
        date: stockData.date,
        description: stockData.description || ''
      };
      
      const response = await api.post(`/materials/${id}/update-stock`, apiData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to receive stock'
      );
    }
  }
);

// Delete material
export const deleteMaterial = createAsyncThunk(
  'materials/deleteMaterial',
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid material ID');
      }
      await api.delete(`/materials/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete material'
      );
    }
  }
);

// Add this after the deleteMaterial thunk

// Delete stock record
export const deleteStockRecord = createAsyncThunk(
  'materials/deleteStockRecord',
  async ({ materialId, batchId }, { rejectWithValue }) => {
    try {
      if (!materialId || materialId === 'undefined' || !batchId) {
        return rejectWithValue('Invalid material ID or batch ID');
      }
      console.log("Deleting stock record for material ID:", materialId, "batch ID:", batchId);
      
      const response = await api.delete(`/materials/${materialId}/stock-records/${batchId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete stock record'
      );
    }
  }
);

const initialState = {
  materials: [],
  currentMaterial: null,
  isLoading: false,
  error: null,
};

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearMaterialError: (state) => {
      state.error = null;
    },
    clearCurrentMaterial: (state) => {
      state.currentMaterial = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all materials
      .addCase(fetchMaterials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.materials = normalizeId(action.payload);
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch single material
      .addCase(fetchMaterialById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterialById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMaterial = action.payload;
      })
      .addCase(fetchMaterialById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create material
      .addCase(createMaterial.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.isLoading = false;
        state.materials.push(action.payload);
      })
      .addCase(createMaterial.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update material
      .addCase(updateMaterial.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        state.isLoading = false;
        // Find and update the material in the list
        const index = state.materials.findIndex(
          (material) => (material.id || material._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.materials[index] = action.payload;
        }
        // Also update the currentMaterial if it's the same one
        if (state.currentMaterial && 
           (state.currentMaterial.id === (action.payload.id || action.payload._id) || 
            state.currentMaterial._id === (action.payload.id || action.payload._id))) {
          state.currentMaterial = action.payload;
        }
      })
      .addCase(updateMaterial.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Receive stock
      .addCase(receiveMaterialStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(receiveMaterialStock.fulfilled, (state, action) => {
        state.isLoading = false;
        // Find and update the material in the list
        const index = state.materials.findIndex(
          (material) => (material.id || material._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.materials[index] = action.payload;
        }
        // Also update the currentMaterial if it's the same one
        if (state.currentMaterial && 
           (state.currentMaterial.id === (action.payload.id || action.payload._id) || 
            state.currentMaterial._id === (action.payload.id || action.payload._id))) {
          state.currentMaterial = action.payload;
        }
      })
      .addCase(receiveMaterialStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete material
      .addCase(deleteMaterial.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.isLoading = false;
        // Filter out the deleted material from the array
        state.materials = state.materials.filter(
          (material) => (material.id || material._id) !== action.payload
        );
      })
      .addCase(deleteMaterial.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete stock record
      .addCase(deleteStockRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStockRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the current material with the returned data
        state.currentMaterial = action.payload.material;
        
        // Also update the material in the materials array if it exists
        const index = state.materials.findIndex(
          (material) => (material.id || material._id) === (action.payload.material.id || action.payload.material._id)
        );
        if (index !== -1) {
          state.materials[index] = action.payload.material;
        }
      })
      .addCase(deleteStockRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMaterialError, clearCurrentMaterial } = materialsSlice.actions;

export default materialsSlice.reducer;
