// tests/review.test.js
// Jest + Supertest tests for Review routes & rating synchronization

const request = require('supertest');
const app = require('../app');

// Mock Review model
jest.mock('../models/Review', () => {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };
});

// Mock Product model
jest.mock('../models/Product', () => {
  return {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
});

const Review = require('../models/Review');
const Product = require('../models/Product');
const {
  addReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  adminDeleteReview,
  updateProductRating,
} = require('../controllers/reviewController');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Review Rating Synchronization & Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1. Create review updates rating
  test('1. Create review updates rating on product', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod1', name: 'Sneakers' });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ _id: 'r1', rating: 5, comment: 'Great', product: 'prod1', user: 'u1' });
    Review.find.mockResolvedValue([{ rating: 5 }]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 5, numReviews: 1 });

    const req = {
      user: { _id: 'u1', id: 'u1' },
      params: { productId: 'prod1' },
      body: { rating: 5, comment: 'Great' }
    };
    const res = mockResponse();

    await addReview(req, res);

    expect(Review.create).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Great',
      product: 'prod1',
      user: 'u1'
    });
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 5,
      numReviews: 1
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // 2. Create second review updates average
  test('2. Create second review updates average rating', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod1', name: 'Sneakers' });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ _id: 'r2', rating: 4, comment: 'Good', product: 'prod1', user: 'u2' });
    Review.find.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 4.5, numReviews: 2 });

    const req = {
      user: { _id: 'u2', id: 'u2' },
      params: { productId: 'prod1' },
      body: { rating: 4, comment: 'Good' }
    };
    const res = mockResponse();

    await addReview(req, res);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 4.5,
      numReviews: 2
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // 3. Update review recalculates average
  test('3. Update review recalculates average rating', async () => {
    const mockReview = {
      _id: 'r2',
      user: 'u2',
      product: 'prod1',
      rating: 4,
      save: jest.fn().mockResolvedValue({ _id: 'r2', user: 'u2', product: 'prod1', rating: 3 }),
    };
    Review.findById.mockResolvedValue(mockReview);
    Review.find.mockResolvedValue([{ rating: 5 }, { rating: 3 }]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 4, numReviews: 2 });

    const req = {
      user: { _id: 'u2', id: 'u2' },
      params: { id: 'r2' },
      body: { rating: 3, comment: 'Changed my mind' }
    };
    const res = mockResponse();

    await updateReview(req, res);

    expect(mockReview.save).toHaveBeenCalled();
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 4,
      numReviews: 2
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 4. Delete review recalculates average
  test('4. Delete review recalculates average rating', async () => {
    const mockReview = {
      _id: 'r2',
      user: 'u2',
      product: 'prod1',
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Review.findById.mockResolvedValue(mockReview);
    Review.find.mockResolvedValue([{ rating: 5 }]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 5, numReviews: 1 });

    const req = {
      user: { _id: 'u2', id: 'u2' },
      params: { id: 'r2' }
    };
    const res = mockResponse();

    await deleteReview(req, res);

    expect(mockReview.deleteOne).toHaveBeenCalled();
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 5,
      numReviews: 1
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 5. No reviews -> rating 0 and numReviews 0
  test('5. No reviews sets rating 0 and numReviews 0', async () => {
    const mockReview = {
      _id: 'r1',
      user: 'u1',
      product: 'prod1',
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Review.findById.mockResolvedValue(mockReview);
    Review.find.mockResolvedValue([]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 0, numReviews: 0 });

    const req = {
      user: { _id: 'u1', id: 'u1' },
      params: { id: 'r1' }
    };
    const res = mockResponse();

    await deleteReview(req, res);

    expect(mockReview.deleteOne).toHaveBeenCalled();
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 0,
      numReviews: 0
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 6. Duplicate review rejected
  test('6. Duplicate review is rejected with 400', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod1' });
    Review.findOne.mockResolvedValue({ _id: 'existing_r', user: 'u1', product: 'prod1' });

    const req = {
      user: { _id: 'u1', id: 'u1' },
      params: { productId: 'prod1' },
      body: { rating: 5 }
    };
    const res = mockResponse();

    await expect(addReview(req, res)).rejects.toThrow('You have already reviewed this product');
    expect(res.statusCode).toBe(400);
  });

  // 7. Rating validation (below 1 or above 5 rejected)
  test('7. Rating below 1 or above 5 rejected', async () => {
    const reqBelow = {
      user: { _id: 'u1', id: 'u1' },
      params: { productId: 'prod1' },
      body: { rating: 0 }
    };
    const resBelow = mockResponse();
    await expect(addReview(reqBelow, resBelow)).rejects.toThrow('Rating must be an integer between 1 and 5');
    expect(resBelow.statusCode).toBe(400);

    const reqAbove = {
      user: { _id: 'u1', id: 'u1' },
      params: { productId: 'prod1' },
      body: { rating: 6 }
    };
    const resAbove = mockResponse();
    await expect(addReview(reqAbove, resAbove)).rejects.toThrow('Rating must be an integer between 1 and 5');
    expect(resAbove.statusCode).toBe(400);
  });

  // 8. Unauthorized review editing/deleting rejected
  test('8. Unauthorized review editing and deleting rejected with 403', async () => {
    Review.findById.mockResolvedValue({ _id: 'r1', user: 'anotherUser', product: 'prod1' });

    const reqUpdate = {
      user: { _id: 'myUser', id: 'myUser' },
      params: { id: 'r1' },
      body: { rating: 4 }
    };
    const resUpdate = mockResponse();
    await expect(updateReview(reqUpdate, resUpdate)).rejects.toThrow('Not authorized to update this review');
    expect(resUpdate.statusCode).toBe(403);

    const reqDelete = {
      user: { _id: 'myUser', id: 'myUser' },
      params: { id: 'r1' }
    };
    const resDelete = mockResponse();
    await expect(deleteReview(reqDelete, resDelete)).rejects.toThrow('Not authorized to delete this review');
    expect(resDelete.statusCode).toBe(403);
  });

  // 9. Admin delete any review recalculates rating
  test('9. Admin delete any review recalculates rating', async () => {
    const mockReview = {
      _id: 'r_admin',
      user: 'someUser',
      product: 'prod1',
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Review.findById.mockResolvedValue(mockReview);
    Review.find.mockResolvedValue([{ rating: 4 }]);
    Product.findByIdAndUpdate.mockResolvedValue({ _id: 'prod1', rating: 4, numReviews: 1 });

    const req = {
      params: { id: 'r_admin' }
    };
    const res = mockResponse();

    await adminDeleteReview(req, res);

    expect(mockReview.deleteOne).toHaveBeenCalled();
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', {
      rating: 4,
      numReviews: 1
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
