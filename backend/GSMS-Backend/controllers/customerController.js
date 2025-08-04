const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const { name, description, country } = req.body;

  const customer = await Customer.create({
    name,
    description: description || '',
    country: country || ''
  });

  res.status(201).json({
    success: true,
    data: customer
  });
});

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  
  let query = {};
  
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { country: searchRegex }
    ];
  }

  const customers = await Customer.find(query)
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Customer.countDocuments(query);

  res.status(200).json({
    success: true,
    count: customers.length,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const { name, description, country } = req.body;

  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Update fields if they are provided
  if (name) customer.name = name;
  if (description !== undefined) customer.description = description;
  if (country !== undefined) customer.country = country;

  const updatedCustomer = await customer.save();

  res.status(200).json({
    success: true,
    data: updatedCustomer
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Check if customer is assigned to any products
  const productsWithCustomer = await mongoose.model('Product').find({ customer: customer._id });
  if (productsWithCustomer.length > 0) {
    res.status(400);
    throw new Error('Cannot delete customer: Customer is assigned to one or more products');
  }

  await Customer.deleteOne({ _id: customer._id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer
};
