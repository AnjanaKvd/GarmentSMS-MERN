// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as your app grows
  },
  // Optional: add middleware here if needed
});

export default store;