import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCustomers, 
  deleteCustomer,
  clearCustomerError,
  resetCustomerState
} from '../../redux/slices/customersSlice';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const CustomersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    customers, 
    loading, 
    error, 
    pagination 
  } = useSelector((state) => state.customers);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch customers on component mount and when pagination/search changes
  useEffect(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm
    };
    
    dispatch(fetchCustomers(params));
    
    // Cleanup function to reset state when component unmounts
    return () => {
      dispatch(resetCustomerState());
    };
  }, [dispatch, page, rowsPerPage, searchTerm]);

  // Handle error state with snackbar
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  const handleEditCustomer = (id) => {
    navigate(`/customers/edit/${id}`);
  };

  const handleViewCustomer = (id) => {
    navigate(`/customers/${id}`);
  };

  const handleDeleteCustomer = async (e, id) => {
    e.stopPropagation(); // Prevent row click event
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        setSnackbar({
          open: true,
          message: 'Customer deleted successfully',
          severity: 'success',
          autoHideDuration: 3000
        });
        // Refresh the customers list
        dispatch(fetchCustomers({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }));
      } catch (error) {
        setSnackbar({
          open: true,
          message: error || 'Failed to delete customer',
          severity: 'error',
          autoHideDuration: 5000
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Customers
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ maxWidth: 400 }}
          />
        </Paper>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow 
                      hover 
                      key={customer._id}
                      onClick={() => handleViewCustomer(customer._id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.country}</TableCell>
                      <TableCell>
                        {customer.description?.length > 50 
                          ? `${customer.description.substring(0, 50)}...` 
                          : customer.description || '-'}
                      </TableCell>
                      <TableCell>
                        {customer.createdAt 
                          ? format(new Date(customer.createdAt), 'PPpp') 
                          : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer._id);
                            }}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error"
                            onClick={(e) => handleDeleteCustomer(e, customer._id)}
                            size="small"
                            disabled={loading}
                            sx={{ '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.04)' } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={pagination.totalItems || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
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

export default CustomersPage;
