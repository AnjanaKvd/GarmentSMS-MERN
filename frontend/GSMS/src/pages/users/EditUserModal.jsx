import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

const EditUserModal = ({ isOpen, onClose, onSubmit, user }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    if (user) {
      setValue('username', user.username);
      setValue('role', user.role);
      setValue('status', user.status);
    }
  }, [user, setValue]);

  const handleFormSubmit = async (data) => {
    await onSubmit(user._id, data);
    reset();
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                      Edit User
                    </Dialog.Title>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="username"
                            {...register('username', {
                              required: 'Username is required',
                              minLength: {
                                value: 3,
                                message: 'Username must be at least 3 characters'
                              }
                            })}
                            className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                              errors.username
                                ? 'ring-red-300 focus:ring-red-500'
                                : 'ring-gray-300 focus:ring-indigo-500'
                            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                            placeholder="Enter username"
                          />
                          {errors.username && (
                            <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <div className="mt-1">
                          <select
                            id="role"
                            {...register('role', {
                              required: 'Role is required'
                            })}
                            className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                              errors.role
                                ? 'ring-red-300 focus:ring-red-500'
                                : 'ring-gray-300 focus:ring-indigo-500'
                            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                          >
                            <option value="">Select a role</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="PRODUCTION">Production</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                          {errors.role && (
                            <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <div className="mt-1">
                          <select
                            id="status"
                            {...register('status', {
                              required: 'Status is required'
                            })}
                            className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                              errors.status
                                ? 'ring-red-300 focus:ring-red-500'
                                : 'ring-gray-300 focus:ring-indigo-500'
                            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                          {errors.status && (
                            <p className="mt-2 text-sm text-red-600">{errors.status.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditUserModal; 