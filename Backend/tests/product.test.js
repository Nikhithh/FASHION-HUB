// tests/product.test.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Mock models
jest.mock('../models/Product', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Brand', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../models/Category', () => ({
  findOne: jest.fn(),
}));

const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
} = require('../controllers/productController');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Product Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // SEARCH & FILTER TESTS
  // ==========================================

  // 1. Keyword search
  test('Keyword search returns products', async () => {
    Product.find.mockResolvedValue([{ name: 'Shirt' }]);
    const req = { query: { keyword: 'shirt' } };
    const res = mockResponse();
    await searchProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /shirt/i });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 2. Case-insensitive search
  test('Case-insensitive search returns products', async () => {
    Product.find.mockResolvedValue([{ name: 'SHIRT' }]);
    const req = { query: { keyword: 'ShiRt' } };
    const res = mockResponse();
    await searchProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /ShiRt/i });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 3. Partial search
  test('Partial search returns products', async () => {
    Product.find.mockResolvedValue([{ name: 'Blue Shirt' }]);
    const req = { query: { keyword: 'hir' } };
    const res = mockResponse();
    await searchProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /hir/i });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 4. No search results
  test('No search results returns empty array', async () => {
    Product.find.mockResolvedValue([]);
    const req = { query: { keyword: 'nonexistent' } };
    const res = mockResponse();
    await searchProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /nonexistent/i });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 0, data: [] });
  });

  // 5. Category filter
  test('Category filter returns products', async () => {
    Category.findOne.mockResolvedValue({ name: 'Shirts' });
    Product.find.mockResolvedValue([{ name: 'Shirt', category: 'Shirts' }]);
    const req = { query: { category: 'Shirts' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Category.findOne).toHaveBeenCalled();
    expect(Product.find).toHaveBeenCalledWith({ category: 'Shirts' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 6. Brand filter
  test('Brand filter returns products', async () => {
    Brand.findOne.mockResolvedValue({ name: 'ABC' });
    Product.find.mockResolvedValue([{ name: 'Shirt', brand: 'ABC' }]);
    const req = { query: { brand: 'ABC' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Brand.findOne).toHaveBeenCalled();
    expect(Product.find).toHaveBeenCalledWith({ brand: 'ABC' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 7. Minimum price
  test('Minimum price returns products', async () => {
    Product.find.mockResolvedValue([{ name: 'Shirt', price: 600 }]);
    const req = { query: { minPrice: '500' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ price: { $gte: 500, $lte: Infinity } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 8. Maximum price
  test('Maximum price returns products', async () => {
    Product.find.mockResolvedValue([{ name: 'Shirt', price: 600 }]);
    const req = { query: { maxPrice: '1000' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ price: { $gte: 0, $lte: 1000 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 9. Keyword + category
  test('Keyword + category filter', async () => {
    Category.findOne.mockResolvedValue({ name: 'Shirts' });
    Product.find.mockResolvedValue([{ name: 'Red Shirt', category: 'Shirts' }]);
    const req = { query: { keyword: 'red', category: 'Shirts' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /red/i, category: 'Shirts' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 10. Keyword + brand
  test('Keyword + brand filter', async () => {
    Brand.findOne.mockResolvedValue({ name: 'ABC' });
    Product.find.mockResolvedValue([{ name: 'Red Shirt', brand: 'ABC' }]);
    const req = { query: { keyword: 'red', brand: 'ABC' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /red/i, brand: 'ABC' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 11. Keyword + price
  test('Keyword + price filter', async () => {
    Product.find.mockResolvedValue([{ name: 'Red Shirt', price: 600 }]);
    const req = { query: { keyword: 'red', minPrice: '500', maxPrice: '1000' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /red/i, price: { $gte: 500, $lte: 1000 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 12. Category + brand + price
  test('Category + brand + price filter', async () => {
    Category.findOne.mockResolvedValue({ name: 'Shirts' });
    Brand.findOne.mockResolvedValue({ name: 'ABC' });
    Product.find.mockResolvedValue([{ name: 'Red Shirt', category: 'Shirts', brand: 'ABC', price: 600 }]);
    const req = { query: { category: 'Shirts', brand: 'ABC', minPrice: '500', maxPrice: '1000' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ category: 'Shirts', brand: 'ABC', price: { $gte: 500, $lte: 1000 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 13. All filters together
  test('All filters together', async () => {
    Category.findOne.mockResolvedValue({ name: 'Shirts' });
    Brand.findOne.mockResolvedValue({ name: 'ABC' });
    Product.find.mockResolvedValue([{ name: 'Red Shirt', category: 'Shirts', brand: 'ABC', price: 600 }]);
    const req = { query: { keyword: 'red', category: 'Shirts', brand: 'ABC', minPrice: '500', maxPrice: '1000' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ name: /red/i, category: 'Shirts', brand: 'ABC', price: { $gte: 500, $lte: 1000 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 14. Invalid category
  test('Invalid category returns 400', async () => {
    Category.findOne.mockResolvedValue(null);
    const req = { query: { category: 'InvalidCat' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid category' });
  });

  // 15. Invalid brand
  test('Invalid brand returns 400', async () => {
    Brand.findOne.mockResolvedValue(null);
    const req = { query: { brand: 'InvalidBrand' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid brand' });
  });

  // 16. Negative price
  test('Negative minPrice returns 400', async () => {
    const req = { query: { minPrice: '-100' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid minimum price' });
  });

  // 17. Non-numeric price
  test('Non-numeric maxPrice returns 400', async () => {
    const req = { query: { maxPrice: 'abc' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid maximum price' });
  });

  // 18. minPrice > maxPrice
  test('minPrice > maxPrice returns 400', async () => {
    const req = { query: { minPrice: '1000', maxPrice: '500' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'minPrice cannot be greater than maxPrice' });
  });

  // 19. Empty filters
  test('Empty filters return all products', async () => {
    Product.find.mockResolvedValue([{ name: 'Shirt' }]);
    const req = { query: { minPrice: '', maxPrice: '' } };
    const res = mockResponse();
    await filterProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ==========================================
  // EXISTING CRUD TESTS
  // ==========================================

  // Approved seller can create product
  test('Approved seller can create product', async () => {
    Category.findOne.mockResolvedValue({ name: 'Category1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Approved' });
    Product.create.mockResolvedValue({ _id: 'p1', name: 'Product1' });

    const req = {
      user: { role: 'seller', id: 's1' },
      body: { name: 'Product1', category: 'Category1', brand: 'b1' }
    };
    const res = mockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  // Pending seller cannot create product
  test('Pending seller cannot create product', async () => {
    Category.findOne.mockResolvedValue({ name: 'Category1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Pending' });

    const req = {
      user: { role: 'seller', id: 's1' },
      body: { name: 'Product1', category: 'Category1', brand: 'b1' }
    };
    const res = mockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Rejected seller cannot create product
  test('Rejected seller cannot create product', async () => {
    Category.findOne.mockResolvedValue({ name: 'Category1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Rejected' });

    const req = {
      user: { role: 'seller', id: 's1' },
      body: { name: 'Product1', category: 'Category1', brand: 'b1' }
    };
    const res = mockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Approved seller can update own product
  test('Approved seller can update own product', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 's1', brand: 'b1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Approved' });
    Category.findOne.mockResolvedValue({ name: 'Category1' });
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'p1', name: 'Updated' });

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' },
      body: { category: 'Category1' }
    };
    const res = mockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Approved seller can delete own product
  test('Approved seller can delete own product', async () => {
    const mockProduct = { _id: 'p1', seller: 's1', deleteOne: jest.fn().mockResolvedValue(true) };
    Product.findById.mockResolvedValue(mockProduct);

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' }
    };
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Seller cannot update another seller's product
  test('Seller cannot update another seller\'s product', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 'anotherS' });

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' },
      body: { name: 'Hack' }
    };
    const res = mockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Seller cannot delete another seller's product
  test('Seller cannot delete another seller\'s product', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 'anotherS' });

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' }
    };
    const res = mockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Product creation fails when category does not exist
  test('Product creation fails when category does not exist', async () => {
    Category.findOne.mockResolvedValue(null);

    const req = {
      user: { role: 'seller', id: 's1' },
      body: { category: 'BadCategory', brand: 'b1' }
    };
    const res = mockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Product update fails when category does not exist
  test('Product update fails when category does not exist', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 's1', brand: 'b1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Approved' });
    Category.findOne.mockResolvedValue(null);

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' },
      body: { category: 'BadCategory' }
    };
    const res = mockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Seller cannot bypass brand verification by sending another brand ID
  test('Seller cannot bypass brand verification by sending another brand ID', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 's1', brand: 'b1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Pending' });

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' },
      body: { brand: 'b2' }
    };
    const res = mockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Seller cannot change the seller/owner field
  test('Seller cannot change the seller/owner field', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', seller: 's1', brand: 'b1' });
    Brand.findById.mockResolvedValue({ verificationStatus: 'Approved' });
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'p1' });

    const req = {
      user: { role: 'seller', id: 's1' },
      params: { id: 'p1' },
      body: { seller: 's2' } 
    };
    const res = mockResponse();

    await updateProduct(req, res);

    expect(req.body.seller).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Admin product permissions continue to work
  test('Admin product permissions continue to work', async () => {
    Product.create.mockResolvedValue({ _id: 'p1' });
    const createReq = {
      user: { role: 'admin', id: 'admin1' },
      body: { name: 'AdminProd' }
    };
    const createRes = mockResponse();
    await createProduct(createReq, createRes);
    expect(createRes.status).toHaveBeenCalledWith(201);

    Product.findById.mockResolvedValue({ _id: 'p2', seller: 's1' });
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'p2', name: 'UpdatedAdmin' });
    const updateReq = {
      user: { role: 'admin', id: 'admin1' },
      params: { id: 'p2' },
      body: { name: 'UpdatedAdmin' }
    };
    const updateRes = mockResponse();
    await updateProduct(updateReq, updateRes);
    expect(updateRes.status).toHaveBeenCalledWith(200);

    const mockProduct = { _id: 'p2', seller: 's1', deleteOne: jest.fn().mockResolvedValue(true) };
    Product.findById.mockResolvedValue(mockProduct);
    const delReq = {
      user: { role: 'admin', id: 'admin1' },
      params: { id: 'p2' }
    };
    const delRes = mockResponse();
    await deleteProduct(delReq, delRes);
    expect(delRes.status).toHaveBeenCalledWith(200);
  });
});
