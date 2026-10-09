const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE_FIELDS = [...ALLOWED_FIELDS, 'createdAt', 'updatedAt'];

const pick = (obj = {}, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value, name) => {
  const n = Number(value);
  if (value === '' || Number.isNaN(n)) throw new AppError(`${name} must be a number`, 400);
  return n;
};

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body, ALLOWED_FIELDS));
  res.status(201).json(product);
});

exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort, page, limit } = req.query;

  // ---- Filtering ----
  const filter = {};
  if (category) filter.category = new RegExp(`^${escapeRegex(String(category).trim())}$`, 'i');
  if (supplier) filter.supplier = new RegExp(`^${escapeRegex(String(supplier).trim())}$`, 'i');
  if (search) filter.name = new RegExp(escapeRegex(String(search).trim()), 'i');

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseNumber(minPrice, 'minPrice');
    if (maxPrice !== undefined) filter.price.$lte = parseNumber(maxPrice, 'maxPrice');
  }

  if (inStock !== undefined) {
    if (!['true', 'false'].includes(inStock)) throw new AppError('inStock must be true or false', 400);
    filter.quantity = inStock === 'true' ? { $gt: 0 } : 0;
  }

  const sortFields = String(sort || '-createdAt')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const field of sortFields) {
    if (!SORTABLE_FIELDS.includes(field.replace(/^-/, ''))) {
      throw new AppError(
        `Cannot sort by '${field.replace(/^-/, '')}'. Allowed: ${SORTABLE_FIELDS.join(', ')}`,
        400
      );
    }
  }
  const sortBy = sortFields.join(' ');

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortBy).skip(skip).limit(limitNum),
  ]);

  res.status(200).json({
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $sort: { quantity: 1, name: 1 } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: { $toString: '$_id' },
      },
    },
  ]);

  res.status(200).json({ count: lowStockItems.length, lowStockItems });
});

exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.status(200).json({ categories: summary.length, summary });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ALLOWED_FIELDS);
  if (Object.keys(updates).length === 0) {
    throw new AppError(`Provide at least one updatable field: ${ALLOWED_FIELDS.join(', ')}`, 400);
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError('Product not found', 404);

  res.status(200).json(product);
});

exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    throw new AppError("'change' must be a non-zero whole number (positive = restock, negative = sale)", 400);
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gte: -change } },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this sale', 400);
  }

  res.status(200).json({ message: 'Stock updated', product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json({ message: 'Product deleted', id: product.id });
});
