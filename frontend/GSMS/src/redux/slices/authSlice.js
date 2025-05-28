// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import {jwtDecode} from 'jwt-decode';

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to login'
      );
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  return null;
});

// New thunk to get current user info from token
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Option 1: Decode the token to get user info
      const decoded = jwtDecode(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return rejectWithValue('Token expired');
      }
      
      // If you need to verify the token with the backend
      // Uncomment this and use instead of the decoded user
      // const response = await api.get('/auth/me');
      // return { user: response.data, token };
      
      return { 
        user: {
          id: decoded.id || decoded.userId || decoded.sub,
          username: decoded.username,
          role: decoded.role
        }, 
        token 
      };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Invalid token');
    }
  }
);

// Check if user is already logged in from localStorage
const token = localStorage.getItem('token');

const initialState = {
  user: null,
  token: token || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;