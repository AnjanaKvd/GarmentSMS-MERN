import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const Production = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    orderId: '',
    cutQty: '',
    usedFabric: '',
    wastageQty: '',
    remarks: '',
    status: 'IN_PROGRESS'
  });

  const fetchProductionLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/production');
      setLogs(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch production logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionLogs();
  }, []);

  const handleOpenDialog = (log = null) => {
    if (log) {
      setSelectedLog(log);
      setFormData({
        orderId: log.orderId,
        cutQty: log.cutQty,
        usedFabric: log.usedFabric,
        wastageQty: log.wastageQty,
        remarks: log.remarks || '',
        status: log.status
      });
    } else {
      setSelectedLog(null);
      setFormData({
        orderId: '',
        cutQty: '',
        usedFabric: '',
        wastageQty: '',
        remarks: '',
        status: 'IN_PROGRESS'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (selectedLog) {
        await api.put(`/production/${selectedLog._id}`, formData);
      } else {
        await api.post('/production', formData);
      }
      handleCloseDialog();
      fetchProductionLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save production log');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this production log?')) {
      try {
        await api.delete(`/production/${id}`);
        fetchProductionLogs();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete production log');
      }
    }
  };

  const filteredLogs = logs.filter(log => 
    log.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-lg text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Production Management</h1>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Production Log
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-6 max-w-lg">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search by Order ID, status, or remarks..."
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cut Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Fabric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wastage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No production logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.cutQty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.usedFabric}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.wastageQty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          log.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.remarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenDialog(log)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(log._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedLog ? 'Edit Production Log' : 'New Production Log'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                    Order ID
                  </label>
                  <input
                    type="text"
                    name="orderId"
                    id="orderId"
                    required
                    value={formData.orderId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cutQty" className="block text-sm font-medium text-gray-700">
                    Cut Quantity
                  </label>
                  <input
                    type="number"
                    name="cutQty"
                    id="cutQty"
                    min="0"
                    required
                    value={formData.cutQty}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="usedFabric" className="block text-sm font-medium text-gray-700">
                    Used Fabric
                  </label>
                  <input
                    type="number"
                    name="usedFabric"
                    id="usedFabric"
                    min="0"
                    required
                    value={formData.usedFabric}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="wastageQty" className="block text-sm font-medium text-gray-700">
                    Wastage Quantity
                  </label>
                  <input
                    type="number"
                    name="wastageQty"
                    id="wastageQty"
                    min="0"
                    value={formData.wastageQty}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    id="remarks"
                    rows="3"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {selectedLog ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production; 