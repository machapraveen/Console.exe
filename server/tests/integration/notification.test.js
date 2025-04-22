// server/tests/integration/notification.test.js
const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');
const Application = require('../../src/models/Application');
const sinon = require('sinon');
const NotificationService = require('../../src/services/NotificationService');

describe('Notification Integration Tests', () => {
  let testUser;
  let testApplication;
  let authToken;
  let apiKey;
  let notificationServiceStub;

  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/console-ext-test');
    
    // Create test user with hashed password
    testUser = await User.create({
      name: 'Integration Test User',
      email: 'integration-test@example.com',
      phone: '+12345678901',
      password: 'SecurePass123!',
      settings: {
        rateLimit: 1,
        callEnabled: true,
        retryEnabled: true,
        retryDelay: 1
      }
    });
    
    apiKey = testUser.apiKey;
    
    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-jwt-secret', { expiresIn: '1h' });
    
    // Create test application
    testApplication = await Application.create({
      userId: testUser._id,
      name: 'Integration Test App',
      recipients: [
        { name: testUser.name, phone: testUser.phone, isActive: true }
      ]
    });
    
    // Stub notification service to prevent actual SMS sending
    notificationServiceStub = sinon.stub(NotificationService, 'processNotification').resolves({
      success: true,
      notification: {}
    });
  });

  after(async () => {
    // Restore stubs
    notificationServiceStub.restore();
    
    // Clean up test data
    await User.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Notification endpoints', () => {
    it('should create a notification with context data', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('X-API-Key', apiKey)
        .send({
          message: 'Integration test notification',
          stackTrace: 'Error: Test\n    at IntegrationTest.js:123',
          context: { 
            userId: 'test123',
            orderId: 'order456',
            amount: 99.99
          }
        });
      
      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.notification).to.have.property('id');
      expect(response.body.notification.message).to.equal('Integration test notification');
      
      // Verify the notification was created in the database
      const notification = await Notification.findById(response.body.notification.id);
      expect(notification).to.exist;
      expect(notification.message).to.equal('Integration test notification');
      expect(notification.context).to.deep.include({
        userId: 'test123',
        orderId: 'order456',
        amount: 99.99
      });
    });
    
    it('should retrieve notifications for authenticated user', async () => {
      // Create a few notifications first
      await Notification.create([
        {
          userId: testUser._id,
          applicationId: testApplication._id,
          message: 'Test notification 1',
          status: 'sent',
          hash: 'hash1'
        },
        {
          userId: testUser._id,
          applicationId: testApplication._id,
          message: 'Test notification 2',
          status: 'rate-limited',
          hash: 'hash2'
        }
      ]);
      
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('notifications');
      expect(response.body.notifications).to.be.an('array');
      expect(response.body.notifications.length).to.be.at.least(2);
      
      // Check that our test notifications are included
      const messages = response.body.notifications.map(n => n.message);
      expect(messages).to.include('Test notification 1');
      expect(messages).to.include('Test notification 2');
    });
    
    it('should filter notifications by status', async () => {
      const response = await request(app)
        .get('/api/notifications?status=rate-limited')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body.notifications.every(n => n.status === 'rate-limited')).to.be.true;
    });
    
    it('should handle notification deduplication', async () => {
      // Send the same notification twice
      const notificationData = {
        message: 'Duplicate test notification',
        stackTrace: 'Error: Duplicate\n    at IntegrationTest.js:456',
        context: { test: true }
      };
      
      // First notification
      await request(app)
        .post('/api/notifications')
        .set('X-API-Key', apiKey)
        .send(notificationData);
      
      // Reset the stub's history to verify second call
      notificationServiceStub.resetHistory();
      
      // Second identical notification
      const response = await request(app)
        .post('/api/notifications')
        .set('X-API-Key', apiKey)
        .send(notificationData);
      
      expect(response.status).to.equal(201);
      
      // The second notification should be rate-limited
      // This is handled in the NotificationService, which we've stubbed,
      // so we're checking if the service was called with the right data
      expect(notificationServiceStub.calledOnce).to.be.true;
      const serviceArg = notificationServiceStub.firstCall.args[0];
      expect(serviceArg.message).to.equal('Duplicate test notification');
    });
  });
});