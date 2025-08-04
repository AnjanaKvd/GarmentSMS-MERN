import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  fetchCustomerById,
  deleteCustomer,
  clearCustomerError,
  clearCurrentCustomer
} from '../../redux/slices/customersSlice';
import { format } from 'date-fns';
import { CircularProgress } from '@mui/material';

const CustomerDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { currentCustomer, loading, error } = useSelector(
    (state) => state.customers
  );
  
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load customer data
  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
    
    return () => {
      dispatch(clearCurrentCustomer());
    };
  }, [dispatch, id]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
      
      // Clear error after showing it
      dispatch(clearCustomerError());
    }
  }, [error, dispatch]);

  const handleEdit = () => {
    navigate(`/customers/edit/${id}`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      dispatch(deleteCustomer(id))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Customer deleted successfully!',
            severity: 'success'
          });
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate('/customers');
          }, 1500);
        })
        .catch((error) => {
          setSnackbar({
            open: true,
            message: error || 'Failed to delete customer',
            severity: 'error'
          });
        });
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && !currentCustomer) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!currentCustomer) {
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
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Customer not found</Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Customers
          </Button>
          
          <Box>
            <Tooltip title="Edit Customer">
              <IconButton 
                onClick={handleEdit}
                color="primary"
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Customer">
              <IconButton 
                onClick={handleDelete}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {currentCustomer.name}
              </Typography>
              <Chip 
                label={currentCustomer.country || 'No country specified'} 
                variant="outlined" 
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {currentCustomer.description || 'No description provided.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Created At
              </Typography>
              <Typography variant="body1">
                {currentCustomer.createdAt 
                  ? format(new Date(currentCustomer.createdAt), 'PPpp') 
                  : 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body1">
                {currentCustomer.updatedAt 
                  ? format(new Date(currentCustomer.updatedAt), 'PPpp') 
                  : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
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

export default CustomerDetail;
