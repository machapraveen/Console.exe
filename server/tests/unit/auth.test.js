// server/tests/unit/auth.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/auth');
const User = require('../../src/models/User');
const crypto = require('crypto');

describe('Auth Middleware', () => {
  let req, res, next, userFindByIdStub, userFindOneStub, jwtVerifyStub;
  
  beforeEach(() => {
    // Mock request, response, next
    req = {
      headers: {},
      user: null
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();
    
    // Stub User model methods
    userFindByIdStub = sinon.stub(User, 'findById');
    userFindOneStub = sinon.stub(User, 'findOne');
    
    // Stub jwt.verify
    jwtVerifyStub = sinon.stub(jwt, 'verify');
  });
  
  afterEach(() => {
    // Restore stubs
    userFindByIdStub.restore();
    userFindOneStub.restore();
    jwtVerifyStub.restore();
  });
  
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const jwtSignStub = sinon.stub(jwt, 'sign').returns('test-token');
      
      const userId = '507f1f77bcf86cd799439011';
      const token = authMiddleware.generateToken(userId);
      
      expect(token).to.equal('test-token');
      expect(jwtSignStub.calledOnce).to.be.true;
      expect(jwtSignStub.firstCall.args[0]).to.deep.equal({ userId });
      
      jwtSignStub.restore();
    });
  });
  
  describe('authenticateUser', () => {
    it('should return 401 if no authorization header', async () => {
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Authentication required' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if token format is invalid', async () => {
      req.headers.authorization = 'InvalidToken';
      
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Authentication required' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if token is blacklisted', async () => {
      req.headers.authorization = 'Bearer blacklisted-token';
      
      // Add token to blacklist
      authMiddleware.revokeToken('blacklisted-token');
      
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Token has been revoked' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if token verification fails', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      jwtVerifyStub.throws(new Error('invalid token'));
      
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      jwtVerifyStub.returns({ userId: 'nonexistent-user-id' });
      userFindByIdStub.resolves(null);
      
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'User no longer exists' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should set req.user and call next() for valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      const user = { _id: 'user-id', name: 'Test User' };
      jwtVerifyStub.returns({ userId: 'user-id' });
      userFindByIdStub.resolves(user);
      
      await authMiddleware.authenticateUser(req, res, next);
      
      expect(req.user).to.deep.equal(user);
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });
  });
  
  describe('authenticateApiKey', () => {
    it('should return 401 if API key is missing', async () => {
      await authMiddleware.authenticateApiKey(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'API key required' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if API key is invalid', async () => {
      req.headers['x-api-key'] = 'invalid-api-key';
      userFindOneStub.resolves(null);
      
      await authMiddleware.authenticateApiKey(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Invalid API key' })).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should set req.user and call next() for valid API key', async () => {
      const apiKey = 'valid-api-key';
      req.headers['x-api-key'] = apiKey;
      
      // Mock the secure compare function
      const secureCompareStub = sinon.stub(crypto, 'timingSafeEqual').returns(true);
      
      const user = { 
        _id: 'user-id', 
        name: 'Test User',
        apiKey
      };
      
      userFindOneStub.resolves(user);
      
      await authMiddleware.authenticateApiKey(req, res, next);
      
      expect(req.user).to.deep.equal(user);
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
      
      secureCompareStub.restore();
    });
  });
  
  describe('logout', () => {
    it('should revoke token and return success message', async () => {
      req.headers.authorization = 'Bearer test-token';
      
      await authMiddleware.logout(req, res);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Logged out successfully' })).to.be.true;
      
      // Should have added token to blacklist
      req.headers.authorization = 'Bearer test-token';
      await authMiddleware.authenticateUser(req, res, next);
      expect(res.json.calledWith({ error: 'Token has been revoked' })).to.be.true;
    });
  });
});