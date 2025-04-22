// tests/server/notification.test.js
const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const app = require('../../server/src/app');
const User = require('../../server/src/models/User');
const Application = require('../../server/src/models/Application');
const Notification = require('../../server/src/models/Notification');
const NotificationService = require('../../server/src/services/NotificationService');

describe('Notification API', () => {
  let testUser;
  let testApp;
  let twilioStub;

  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Stub Twilio service
    twilioStub = sinon.stub(NotificationService, 'sendSMS').resolves({
      sid: 'test-sid',
      status: 'delivered'
    });
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      apiKey: 'test-api-key',
      password: 'password123'
    });
    
    // Create test application
    testApp = await Application.create({
      userId: testUser._id,
      name: 'Test App',
      recipients: [
        { name: 'Test User', phone: testUser.phone, isActive: true }
      ]
    });
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    
    // Restore Twilio stub
    twilioStub.restore();
    
    // Disconnect from test database
    await mongoose.connection.close();
  });

  describe('POST /api/notifications', () => {
    it('should return 401 if API key is missing', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          message: 'Test error',
          stackTrace: 'Error: Test\n    at Test.js:1:1',
          context: { test: true }
        });
      
      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('API key required');
    });

    it('should return 401 if API key is invalid', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('X-API-Key', 'invalid-api-key')
        .send({
          message: 'Test error',
          stackTrace: 'Error: Test\n    at Test.js:1:1',
          context: { test: true }
        });
      
      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('Invalid API key');
    });

    it('should create notification with valid API key', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('X-API-Key', 'test-api-key')
        .send({
          message: 'Test error',
          stackTrace: 'Error: Test\n    at Test.js:1:1',
          context: { test: true }
        });
      
      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.notification).to.have.property('id');
      expect(response.body.notification.message).to.equal('Test error');
      
      // Verify notification was saved to database
      const notification = await Notification.findById(response.body.notification.id);
      expect(notification).to.exist;
      expect(notification.message).to.equal('Test error');
      expect(notification.userId.toString()).to.equal(testUser._id.toString());
      expect(notification.context).to.deep.equal({ test: true });
      
      // Verify SMS was sent
      expect(twilioStub.calledOnce).to.be.true;
    });

    it('should handle rate limiting for duplicate errors', async () => {
      // First notification
      await request(app)
        .post('/api/notifications')
        .set('X-API-Key', 'test-api-key')
        .send({
          message: 'Duplicate error',
          stackTrace: 'Error: Duplicate\n    at Test.js:2:2',
          context: { test: true }
        });
      
      // Reset Twilio stub
      twilioStub.resetHistory();
      
      // Send duplicate within rate limit window
      const response = await request(app)
        .post('/api/notifications')
        .set('X-API-Key', 'test-api-key')
        .send({
          message: 'Duplicate error',
          stackTrace: 'Error: Duplicate\n    at Test.js:2:2',
          context: { test: true }
        });
      
      expect(response.status).to.equal(201);
      
      // Find the notification
      const notification = await Notification.findById(response.body.notification.id);
      expect(notification).to.exist;
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify notification was marked as rate-limited
      const updatedNotification = await Notification.findById(notification._id);
      expect(updatedNotification.status).to.equal('rate-limited');
      
      // Verify no SMS was sent for the duplicate
      expect(twilioStub.called).to.be.false;
    });
  });

  describe('GET /api/notifications', () => {
    let authToken;
    
    before(async () => {
      // Login to get auth token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/notifications');
      
      expect(response.status).to.equal(401);
    });

    it('should return user notifications when authenticated', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('notifications');
      expect(response.body.notifications).to.be.an('array');
      
      // Verify we're getting the notifications we created earlier
      const notifications = response.body.notifications;
      expect(notifications.length).to.be.at.least(2);
      
      // Verify notification properties
      const notification = notifications[0];
      expect(notification).to.have.property('_id');
      expect(notification).to.have.property('message');
      expect(notification).to.have.property('status');
      expect(notification).to.have.property('createdAt');
    });
  });
});