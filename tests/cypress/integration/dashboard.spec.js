// tests/cypress/integration/dashboard.spec.js
describe('Dashboard E2E Tests', () => {
    beforeEach(() => {
      // Mock login first
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          token: 'test-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            apiKey: 'test-api-key'
          }
        }
      });
  
      // Login
      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });
  
    it('displays dashboard with notifications', () => {
      // Mock notifications API
      cy.intercept('GET', '/api/notifications*', {
        statusCode: 200,
        body: {
          notifications: [
            {
              _id: '1',
              message: 'Payment processing failed',
              status: 'sent',
              createdAt: new Date().toISOString(),
              context: { userId: '123', amount: 50 }
            },
            {
              _id: '2',
              message: 'Database connection error',
              status: 'failed',
              createdAt: new Date().toISOString()
            }
          ]
        }
      });
  
      // Mock stats API
      cy.intercept('GET', '/api/notifications/stats', {
        statusCode: 200,
        body: {
          overall: {
            total: 245,
            sent: 220,
            rateLimited: 15,
            failed: 10
          },
          timeRanges: {
            last24Hours: 15,
            last7Days: 85
          },
          byApplication: []
        }
      });
  
      // Reload dashboard
      cy.visit('/dashboard');
      
      // Check notifications are displayed
      cy.contains('Payment processing failed').should('be.visible');
      cy.contains('Database connection error').should('be.visible');
      
      // Check status badges
      cy.contains('Sent').should('be.visible');
      cy.contains('Failed').should('be.visible');
      
      // Check quick setup section
      cy.contains('Quick Setup').should('be.visible');
      cy.contains('test-api-key').should('be.visible');
  
      // Check stats
      cy.contains('Last 24h').should('be.visible');
      cy.contains('15').should('be.visible');
    });
  
    it('displays empty state when no notifications', () => {
      // Mock empty notifications
      cy.intercept('GET', '/api/notifications*', {
        statusCode: 200,
        body: {
          notifications: []
        }
      });
  
      // Mock stats API
      cy.intercept('GET', '/api/notifications/stats', {
        statusCode: 200,
        body: {
          overall: {
            total: 0,
            sent: 0,
            rateLimited: 0,
            failed: 0
          },
          timeRanges: {
            last24Hours: 0,
            last7Days: 0
          },
          byApplication: []
        }
      });
  
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Check empty state message
      cy.contains('No notifications yet').should('be.visible');
    });
  
    it('can expand notification details', () => {
      // Mock notification with details
      cy.intercept('GET', '/api/notifications*', {
        statusCode: 200,
        body: {
          notifications: [
            {
              _id: '1',
              message: 'Payment processing failed',
              status: 'sent',
              createdAt: new Date().toISOString(),
              context: { userId: '123', amount: 50 },
              stackTrace: 'Error: Payment processing failed\n    at processPayment (payment.js:42)\n    at checkout (checkout.js:15)',
              deliveryAttempts: [
                {
                  timestamp: new Date().toISOString(),
                  status: 'sent',
                  method: 'sms'
                }
              ]
            }
          ]
        }
      });
  
      // Mock stats API
      cy.intercept('GET', '/api/notifications/stats', {
        statusCode: 200,
        body: {
          overall: { total: 1, sent: 1, rateLimited: 0, failed: 0 },
          timeRanges: { last24Hours: 1, last7Days: 1 },
          byApplication: []
        }
      });
  
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Click on notification to expand
      cy.contains('Payment processing failed').click();
      
      // Check that expanded content is visible
      cy.contains('Stack Trace').should('be.visible');
      cy.contains('Error: Payment processing failed').should('be.visible');
      cy.contains('Context').should('be.visible');
      cy.contains('Delivery Attempts').should('be.visible');
    });
  
    it('navigates to applications page', () => {
      // Mock applications API
      cy.intercept('GET', '/api/applications', {
        statusCode: 200,
        body: {
          applications: [
            {
              _id: '1',
              name: 'Test App',
              recipients: [
                { name: 'Test User', phone: '+1234567890', isActive: true }
              ]
            }
          ]
        }
      });
  
      // Click on Applications link
      cy.contains('Applications').click();
      
      // Should go to applications page
      cy.url().should('include', '/applications');
      
      // Check app is displayed
      cy.contains('Test App').should('be.visible');
    });
  
    it('adds a new recipient', () => {
      // Mock applications API
      cy.intercept('GET', '/api/applications', {
        statusCode: 200,
        body: {
          applications: [
            {
              _id: '1',
              name: 'Test App',
              recipients: [
                { name: 'Test User', phone: '+1234567890', isActive: true }
              ]
            }
          ]
        }
      });
  
      // Mock single application API
      cy.intercept('GET', '/api/applications/1', {
        statusCode: 200,
        body: {
          _id: '1',
          name: 'Test App',
          recipients: [
            { _id: 'rec1', name: 'Test User', phone: '+1234567890', isActive: true }
          ]
        }
      });
  
      // Mock add recipient API
      cy.intercept('POST', '/api/applications/1/recipients', {
        statusCode: 201,
        body: {
          success: true,
          application: {
            _id: '1',
            name: 'Test App',
            recipients: [
              { _id: 'rec1', name: 'Test User', phone: '+1234567890', isActive: true },
              { _id: 'rec2', name: 'New User', phone: '+9876543210', isActive: true }
            ]
          }
        }
      });
  
      // Go to application detail page
      cy.visit('/applications/1');
      
      // Click add recipient button
      cy.contains('Add Recipient').click();
      
      // Fill in the form
      cy.get('input[name="name"]').type('New User');
      cy.get('input[name="phone"]').type('+9876543210');
      cy.contains('button', 'Add Recipient').click();
      
      // Verify new recipient is displayed
      cy.contains('New User').should('be.visible');
      cy.contains('+9876543210').should('be.visible');
    });
  
    it('logs out successfully', () => {
      // Mock logout API
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          message: 'Logged out successfully'
        }
      });
  
      // Click on logout button
      cy.contains('Logout').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
    });
  });