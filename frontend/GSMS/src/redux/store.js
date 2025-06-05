// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import materialsReducer from './slices/materialsSlice';
import productsReducer from './slices/productsSlice';
import productionReducer from './slices/productionSlice';
import reportsReducer from './slices/reportsSlice';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    materials: materialsReducer,
    products: productsReducer,
    production: productionReducer,
    reports: reportsReducer,
    dashboard: dashboardReducer,
    // Add other reducers here as your app grows
  },
  // Optional: add middleware here if needed
});

export default store;