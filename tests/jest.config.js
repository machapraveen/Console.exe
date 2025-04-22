// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    collectCoverageFrom: [
      'dashboard/src/**/*.{js,jsx}',
      '!dashboard/src/index.jsx',
      '!dashboard/src/reportWebVitals.js'
    ],
    coverageThreshold: {
      global: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    }
  };
  
  // package.json scripts section
  {
    "scripts"; {
      "test"; "jest",
      "test:coverage"; "jest --coverage",
      "test:watch"; "jest --watch"
      "test:server"; "mocha tests/server/**/*.js",
      "test:client"; "mocha tests/client/**/*.js",
      "test:e2e"; "cypress run"
    }
  }
  
  // cypress/integration/dashboard.spec.js
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
      cy.intercept('GET', '/api/notifications', {
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
    });
  
    it('displays empty state when no notifications', () => {
      // Mock empty notifications
      cy.intercept('GET', '/api/notifications', {
        statusCode: 200,
        body: {
          notifications: []
        }
      });
  
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Check empty state message
      cy.contains('No notifications yet').should('be.visible');
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
  
      // Mock add recipient API
      cy.intercept('POST', '/api/applications/1/recipients', {
        statusCode: 201,
        body: {
          success: true,
          application: {
            _id: '1',
            name: 'Test App',
            recipients: [
              { name: 'Test User', phone: '+1234567890', isActive: true },
              { name: 'New User', phone: '+9876543210', isActive: true }
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
      cy.contains('button', 'Add').click();
      
      // Verify new recipient is displayed
      cy.contains('New User').should('be.visible');
      cy.contains('+9876543210').should('be.visible');
    });
  
    it('logs out successfully', () => {
      // Click on logout button
      cy.contains('Logout').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
    });
  });