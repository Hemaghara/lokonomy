const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
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

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET || 'test');
    
    
    const res = await request(app)
      .get(`/api/admin/analytics/overview`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
  });
});
