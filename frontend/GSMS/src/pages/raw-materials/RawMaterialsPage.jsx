import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMaterials, clearMaterialError } from '../../redux/slices/materialsSlice';
import MaterialFormModal from '../../components/raw-materials/MaterialFormModal';
import ReceiveStockModal from '../../components/raw-materials/ReceiveStockModal';

// Icons from Heroicons
import { 
  PlusIcon, 
  ArrowDownOnSquareIcon, 
  PencilIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const RawMaterialsPage = () => {
  const dispatch = useDispatch();
  const { materials, isLoading, error } = useSelector((state) => state.materials);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  const canEdit = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    dispatch(fetchMaterials());
    
    // Clear any errors when component unmounts
    return () => {
      dispatch(clearMaterialError());
    };
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredMaterials = materials.filter((material) => {
    return (
      material.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEditClick = (material) => {
    if (!material || (!material.id && !material._id)) {
      console.error("Invalid material for editing", material);
      return;
    }
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleReceiveClick = (material) => {
    if (!material || (!material.id && !material._id)) {
      console.error("Invalid material for receiving stock", material);
      return;
    }
    setSelectedMaterial(material);
    setShowReceiveModal(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Raw Materials</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all raw materials in your inventory
          </p>
        </div>
        {canEdit && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Material
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="mt-6 mb-4 flex-1 max-w-lg">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search by item code or name..."
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="mt-6 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Item Code
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Material Name
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Current Stock
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Updated
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        <div className="flex justify-center items-center">
                          <svg className="animate-spin h-5 w-5 mr-3 text-indigo-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading materials...
                        </div>
                      </td>
                    </tr>
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No materials found. {canEdit && "Add a new material to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material) => (
                      <tr key={material.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {material.itemCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.currentStock} {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(material.updatedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/raw-materials/${material.id || material._id}/ledger`}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View Ledger
                          </Link>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleReceiveClick(material)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                <ArrowDownOnSquareIcon className="h-5 w-5 inline" /> Receive
                              </button>
                              <button
                                onClick={() => handleEditClick(material)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-5 w-5 inline" /> Edit
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <MaterialFormModal 
          onClose={() => setShowAddModal(false)} 
          isEdit={false}
        />
      )}

      {/* Edit Material Modal */}
      {showEditModal && selectedMaterial && (
        <MaterialFormModal 
          onClose={() => setShowEditModal(false)} 
          isEdit={true}
          material={selectedMaterial}
        />
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && selectedMaterial && (
        <ReceiveStockModal 
          onClose={() => setShowReceiveModal(false)} 
          material={selectedMaterial}
        />
      )}
    </div>
  );
};

export default RawMaterialsPage;
