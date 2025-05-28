import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const UserManagementPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/user/users');
        setUsers(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.response?.data?.message || 'Failed to fetch users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (userData) => {
    try {
      setIsUpdating(true);
      const response = await api.post('/user/users', userData);
      setUsers([...users, response.data]);
      setIsAddUserModalOpen(false);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditUser = async (userId, userData) => {
    try {
      setIsUpdating(true);
      const response = await api.patch(`/user/users/${userId}`, userData);
      setUsers(users.map(user => user._id === userId ? response.data : user));
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/user/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in your system including their username, role, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            disabled={isUpdating}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add User
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="mt-4 max-w-lg">
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Username
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Updated
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.role}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(user.updatedAt).toLocaleString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            disabled={isUpdating}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUser}
        isLoading={isUpdating}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleEditUser}
        user={selectedUser}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default UserManagementPage; 