import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  useNavigate, 
  useParams,
  useLocation
} from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Typography, 
  Grid,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { 
  createCustomer, 
  updateCustomer,
  fetchCustomerById,
  clearCustomerError,
  clearCurrentCustomer
} from '../../redux/slices/customersSlice';

const CustomerForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  const { currentCustomer, loading, error, success } = useSelector(
    (state) => state.customers
  );
  
  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load customer data in edit mode
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchCustomerById(id));
    }
    
    return () => {
      if (isEditMode) {
        dispatch(clearCurrentCustomer());
      }
    };
  }, [dispatch, id, isEditMode]);

  // Update form data when currentCustomer changes (edit mode)
  useEffect(() => {
    if (isEditMode && currentCustomer) {
      setFormData({
        name: currentCustomer.name || '',
        description: currentCustomer.description || '',
        country: currentCustomer.country || ''
      });
    }
  }, [currentCustomer, isEditMode]);

  // Handle success and error states
  useEffect(() => {
    if (success) {
      const message = isEditMode 
        ? 'Customer updated successfully!' 
        : 'Customer created successfully!';
      
      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });
      
      // Redirect after a short delay
      const timer = setTimeout(() => {
        navigate('/customers');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
      
      // Clear error after showing it
      dispatch(clearCustomerError());
    }
  }, [success, error, dispatch, navigate, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditMode) {
      dispatch(updateCustomer({ id, customerData: formData }));
    } else {
      dispatch(createCustomer(formData));
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Customers
        </Button>
        
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  margin="normal"
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={!!formErrors.country}
                  helperText={formErrors.country}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {isEditMode ? 'Update Customer' : 'Create Customer'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerForm;
