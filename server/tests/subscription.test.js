const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');

describe('Subscription Middleware', () => {
  it('should block expired subscription users from premium features', async () => {
    const user = await User.create({
      name: 'Expired', email: 'expired@test.com',
      password: 'hash', 
      subscription: {
        plan: 'gold', status: 'active',
        expiryDate: new Date(Date.now() - 86400000), 
      }
    });

    const business = await Business.create({
      businessName: 'Expired Business',
      ownerId: user._id,
      ownerName: 'Expired Owner',
      mainCategory: 'Food',
      subCategory: 'Bakery',
      contactNumber: '9876543210',
      address: '123 Expired St',
      district: 'Surat',
      taluka: 'Chorasi',
      location: {
        type: 'Point',
        coordinates: [72.8293, 21.1702]
      }
    });

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET || 'test');
    
    const res = await request(app)
      .get(`/api/aiinsights/${business._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
  });
});
