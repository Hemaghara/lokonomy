const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lokonomy').then(async () => {
  const plans = await mongoose.connection.collection('plans').find().toArray();
  console.log('Plans in DB:', plans.length ? plans.map(p => p.slug + ': ' + (p.limits ? p.limits.aiInsights : 'no limits obj')) : 'None');
  
  const users = await mongoose.connection.collection('users').find({ 'subscription.plan': { $in: ['gold', 'platinum'] } }).toArray();
  console.log('Gold/Platinum users:', JSON.stringify(users.map(u => ({ email: u.email, sub: u.subscription })), null, 2));
  
  process.exit(0);
}).catch(console.error);
