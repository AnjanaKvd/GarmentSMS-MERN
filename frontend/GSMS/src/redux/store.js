// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import materialsReducer from './slices/materialsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    materials: materialsReducer,
    // Add other reducers here as your app grows
  },
  // Optional: add middleware here if needed
});

export default store;