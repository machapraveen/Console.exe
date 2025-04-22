// src/services/NotificationService.js
const twilio = require('twilio');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Application = require('../models/Application');

class NotificationService {
  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async processNotification(notification) {
    try {
      // Check if this is a duplicate within rate limit window
      const isDuplicate = await this.checkDuplication(notification);
      if (isDuplicate) {
        notification.status = 'rate-limited';
        await notification.save();
        return { success: false, message: 'Rate limited' };
      }

      // Get active recipients
      const application = await Application.findById(notification.applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const activeRecipients = application.recipients.filter(r => r.isActive);
      if (activeRecipients.length === 0) {
        const user = await User.findById(notification.userId);
        activeRecipients.push({ name: user.name, phone: user.phone });
      }

      // Send SMS to all active recipients
      for (const recipient of activeRecipients) {
        await this.sendSMS(recipient.phone, notification.message);
      }

      // Update notification status
      notification.status = 'sent';
      notification.deliveryAttempts.push({
        status: 'sent',
        responseData: { recipients: activeRecipients.length }
      });
      await notification.save();

      // Schedule retry if enabled
      const user = await User.findById(notification.userId);
      if (user.settings.retryEnabled) {
        this.scheduleRetry(notification, user.settings.retryDelay);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing notification:', error);
      notification.status = 'failed';
      notification.deliveryAttempts.push({
        status: 'failed',
        responseData: { error: error.message }
      });
      await notification.save();
      return { success: false, error: error.message };
    }
  }

  async sendSMS(phoneNumber, message) {
    return this.twilioClient.messages.create({
      body: message,
      from: this.twilioPhoneNumber,
      to: phoneNumber
    });
  }

  async makeCall(phoneNumber, message) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice' }, `Alert from Console dot E X T. ${message}`);
    
    return this.twilioClient.calls.create({
      twiml: twiml.toString(),
      from: this.twilioPhoneNumber,
      to: phoneNumber
    });
  }

  async checkDuplication(notification) {
    // Find recent notifications with same hash
    const recentDuplicate = await Notification.findOne({
      hash: notification.hash,
      applicationId: notification.applicationId,
      createdAt: { 
        $gt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes
      },
      status: 'sent'
    });

    return !!recentDuplicate;
  }

  scheduleRetry(notification, delayMinutes) {
    setTimeout(async () => {
      try {
        // Reload notification to get current status
        const freshNotification = await Notification.findById(notification._id);
        if (!freshNotification || freshNotification.status !== 'sent') {
          return;
        }

        // Check if there's been a response
        // For a real app, we would have some way to track if the user responded
        // For now, we'll just retry unconditionally
        
        const user = await User.findById(freshNotification.userId);
        const application = await Application.findById(freshNotification.applicationId);
        
        if (!user || !application) {
          return;
        }

        // Make calls instead of SMS for retry
        const activeRecipients = application.recipients.filter(r => r.isActive);
        if (activeRecipients.length === 0) {
          activeRecipients.push({ name: user.name, phone: user.phone });
        }

        for (const recipient of activeRecipients) {
          if (user.settings.callEnabled) {
            await this.makeCall(recipient.phone, freshNotification.message);
          } else {
            await this.sendSMS(recipient.phone, `RETRY: ${freshNotification.message}`);
          }
        }

        // Update notification
        freshNotification.deliveryAttempts.push({
          status: 'sent',
          responseData: { 
            retry: true, 
            method: user.settings.callEnabled ? 'call' : 'sms' 
          }
        });
        await freshNotification.save();
      } catch (error) {
        console.error('Error in retry mechanism:', error);
      }
    }, delayMinutes * 60 * 1000);
  }
}

module.exports = new NotificationService();