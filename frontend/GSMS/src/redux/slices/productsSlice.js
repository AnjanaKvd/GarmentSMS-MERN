import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeId } from '../../utils/apiHelpers';

// Fetch all products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products');
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products'
      );
    }
  }
);

// Fetch a single product with details
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid product ID');
      }
      const response = await api.get(`/products/${id}`);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product details'
      );
    }
  }
);

// Fetch BOM for a product
export const fetchProductBOM = createAsyncThunk(
  'products/fetchProductBOM',
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid product ID');
      }
      const response = await api.get(`/products/${id}/bom`);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch BOM'
      );
    }
  }
);

// Create new product
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', productData);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create product'
      );
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid product ID');
      }
      const response = await api.put(`/products/${id}`, productData);
      return normalizeId(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update product'
      );
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === 'undefined') {
        return rejectWithValue('Invalid product ID');
      }
      await api.delete(`/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete product'
      );
    }
  }
);

const initialState = {
  products: [],
  currentProduct: null,
  currentBOM: null,
  isLoading: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.currentBOM = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch product BOM
      .addCase(fetchProductBOM.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductBOM.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBOM = action.payload;
      })
      .addCase(fetchProductBOM.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(
          (product) => (product.id || product._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct && 
           (state.currentProduct.id === (action.payload.id || action.payload._id) || 
            state.currentProduct._id === (action.payload.id || action.payload._id))) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter(
          (product) => (product.id || product._id) !== action.payload
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
  },
});

export const { clearProductError, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer; 