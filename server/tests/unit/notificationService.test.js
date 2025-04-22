// server/tests/unit/notificationService.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const NotificationService = require('../../src/services/NotificationService');
const Notification = require('../../src/models/Notification');
const Application = require('../../src/models/Application');
const User = require('../../src/models/User');
const twilio = require('twilio');

describe('NotificationService', () => {
  let twilioClientStub;
  let notificationSaveStub;
  let applicationFindByIdStub;
  let userFindByIdStub;
  let notificationFindByIdStub;
  let mockNotification;
  let mockApplication;
  let mockUser;
  
  beforeEach(() => {
    // Reset mock data
    mockUser = {
      _id: 'user123',
      name: 'Test User',
      phone: '+1234567890',
      settings: {
        rateLimit: 5,
        callEnabled: false,
        retryEnabled: true,
        retryDelay: 5
      }
    };
    
    mockApplication = {
      _id: 'app123',
      userId: mockUser._id,
      name: 'Test App',
      recipients: [
        { name: 'Recipient 1', phone: '+1111111111', isActive: true },
        { name: 'Recipient 2', phone: '+2222222222', isActive: false }
      ]
    };
    
    mockNotification = {
      _id: 'notification123',
      userId: mockUser._id,
      applicationId: mockApplication._id,
      message: 'Test notification',
      status: 'pending',
      deliveryAttempts: [],
      hash: 'testhash',
      save: sinon.stub().resolves()
    };
    
    // Add getActiveRecipients method to mockApplication
    mockApplication.getActiveRecipients = () => 
      mockApplication.recipients.filter(r => r.isActive);
    
    // Setup stubs
    notificationSaveStub = mockNotification.save;
    
    applicationFindByIdStub = sinon.stub(Application, 'findById')
      .resolves(mockApplication);
    
    userFindByIdStub = sinon.stub(User, 'findById')
      .resolves(mockUser);
    
    notificationFindByIdStub = sinon.stub(Notification, 'findById')
      .resolves(mockNotification);
    
    // Stub twilio client
    const twilioMessagesCreateStub = sinon.stub().resolves({
      sid: 'SM123',
      status: 'sent'
    });
    
    const twilioCallsCreateStub = sinon.stub().resolves({
      sid: 'CA123',
      status: 'initiated'
    });
    
    twilioClientStub = {
      messages: { create: twilioMessagesCreateStub },
      calls: { create: twilioCallsCreateStub }
    };
    
    sinon.stub(twilio, 'twiml').returns({
      VoiceResponse: function() {
        return {
          say: sinon.stub().returns(this),
          toString: sinon.stub().returns('<Response><Say>Test</Say></Response>')
        };
      }
    });
    
    sinon.stub(twilio, 'constructor').returns(twilioClientStub);
    
    // Replace the service instance's twilio client
    NotificationService.twilioClient = twilioClientStub;
    NotificationService.twilioPhoneNumber = '+9999999999';
    
    // Stub checkDuplication
    sinon.stub(NotificationService, 'checkDuplication').resolves(false);
    
    // Stub setTimeout to execute callback immediately
    sinon.stub(global, 'setTimeout').callsFake((callback) => {
      callback();
      return 123; // Return a fake timeout ID
    });
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('processNotification', () => {
    it('should process a notification successfully', async () => {
      const result = await NotificationService.processNotification(mockNotification, mockUser);
      
      expect(result.success).to.be.true;
      expect(mockNotification.status).to.equal('sent');
      expect(notificationSaveStub.calledOnce).to.be.true;
      
      // Should send SMS to active recipients
      expect(twilioClientStub.messages.create.calledOnce).to.be.true;
      expect(twilioClientStub.messages.create.firstCall.args[0]).to.deep.include({
        body: 'Test notification',
        from: '+9999999999',
        to: '+1111111111'
      });
      
      // Should schedule a retry
      expect(global.setTimeout.calledOnce).to.be.true;
    });
    
    it('should handle rate-limited notifications', async () => {
      // Make checkDuplication return true to simulate a duplicate
      NotificationService.checkDuplication.restore();
      sinon.stub(NotificationService, 'checkDuplication').resolves(true);
      
      const result = await NotificationService.processNotification(mockNotification, mockUser);
      
      expect(result.success).to.be.false;
      expect(result.message).to.equal('Rate limited');
      expect(mockNotification.status).to.equal('rate-limited');
      expect(notificationSaveStub.calledOnce).to.be.true;
      
      // Should not send SMS for rate-limited notifications
      expect(twilioClientStub.messages.create.called).to.be.false;
    });
    
    it('should handle missing application', async () => {
      applicationFindByIdStub.resolves(null);
      
      const result = await NotificationService.processNotification(mockNotification, mockUser);
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Application not found');
      expect(mockNotification.status).to.equal('failed');
      expect(notificationSaveStub.calledOnce).to.be.true;
    });
    
    it('should use user as recipient if no active recipients', async () => {
      // Remove all active recipients
      mockApplication.recipients = [
        { name: 'Inactive', phone: '+3333333333', isActive: false }
      ];
      
      const result = await NotificationService.processNotification(mockNotification, mockUser);
      
      expect(result.success).to.be.true;
      expect(twilioClientStub.messages.create.calledOnce).to.be.true;
      expect(twilioClientStub.messages.create.firstCall.args[0]).to.deep.include({
        to: mockUser.phone
      });
    });
    
    it('should handle errors during processing', async () => {
      // Make twilio throw an error
      twilioClientStub.messages.create.rejects(new Error('Twilio error'));
      
      const result = await NotificationService.processNotification(mockNotification, mockUser);
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Twilio error');
      expect(mockNotification.status).to.equal('failed');
      
      // Should save failure in delivery attempts
      expect(mockNotification.deliveryAttempts[0].status).to.equal('failed');
      expect(notificationSaveStub.calledOnce).to.be.true;
    });
  });
  
  describe('scheduleRetry', () => {
    it('should retry with SMS by default', async () => {
      await NotificationService.scheduleRetry(mockNotification, mockUser.settings, [
        { name: 'Recipient 1', phone: '+1111111111' }
      ]);
      
      // Should send SMS for retry
      expect(twilioClientStub.messages.create.calledOnce).to.be.true;
      expect(twilioClientStub.messages.create.firstCall.args[0].body).to.include('RETRY:');
      
      // Should update notification
      expect(mockNotification.deliveryAttempts.length).to.be.greaterThan(0);
      expect(notificationSaveStub.calledOnce).to.be.true;
    });
    
    it('should retry with call if callEnabled is true', async () => {
      // Enable calls in user settings
      mockUser.settings.callEnabled = true;
      
      await NotificationService.scheduleRetry(mockNotification, mockUser.settings, [
        { name: 'Recipient 1', phone: '+1111111111' }
      ]);
      
      // Should make a call for retry
      expect(twilioClientStub.calls.create.calledOnce).to.be.true;
      
      // Should update notification
      expect(mockNotification.deliveryAttempts.length).to.be.greaterThan(0);
      expect(notificationSaveStub.calledOnce).to.be.true;
    });
    
    it('should not retry if notification status has changed', async () => {
      // Change notification status
      const changedNotification = {
        ...mockNotification,
        status: 'failed'
      };
      notificationFindByIdStub.resolves(changedNotification);
      
      await NotificationService.scheduleRetry(mockNotification, mockUser.settings, [
        { name: 'Recipient 1', phone: '+1111111111' }
      ]);
      
      // Should not send SMS or make calls
      expect(twilioClientStub.messages.create.called).to.be.false;
      expect(twilioClientStub.calls.create.called).to.be.false;
    });
  });
});