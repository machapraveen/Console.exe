// tests/client/console-override.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const consoleExt = require('../../client/src/console-override');
const axios = require('axios');

describe('Console.ext Client Library', () => {
  let originalConsole;
  let axiosStub;

  before(() => {
    // Store original console methods
    originalConsole = {
      error: console.error,
      log: console.log,
      warn: console.warn,
      info: console.info,
      ext: console.ext
    };

    // Stub axios to prevent actual API calls
    axiosStub = sinon.stub(axios, 'request').resolves({ data: { success: true } });
  });

  after(() => {
    // Restore original console methods
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    if (originalConsole.ext) {
      console.ext = originalConsole.ext;
    } else {
      delete console.ext;
    }

    // Restore axios
    axiosStub.restore();
  });

  describe('initConsoleExt', () => {
    it('should return false if no API key is provided', () => {
      const result = consoleExt.init();
      expect(result).to.be.false;
    });

    it('should return true when initialized with valid API key', () => {
      const result = consoleExt.init('test-api-key');
      expect(result).to.be.true;
    });
  });

  describe('console.ext', () => {
    beforeEach(() => {
      // Initialize console.ext before each test
      consoleExt.init('test-api-key');
      
      // Reset axios stub
      axiosStub.reset();
    });

    it('should call original console.error', () => {
      const errorSpy = sinon.spy(console, 'error');
      
      console.ext('Test error message');
      
      expect(errorSpy.calledOnce).to.be.true;
      expect(errorSpy.calledWith('Test error message')).to.be.true;
      
      errorSpy.restore();
    });

    it('should send notification to API', () => {
      console.ext('Test error message');
      
      expect(axiosStub.calledOnce).to.be.true;
      
      const callArgs = axiosStub.getCall(0).args[0];
      expect(callArgs.method).to.equal('post');
      expect(callArgs.headers['X-API-Key']).to.equal('test-api-key');
      expect(callArgs.data.message).to.equal('Test error message');
    });

    it('should handle objects in error message', () => {
      const testObj = { name: 'Test', value: 123 };
      console.ext('Error with object:', testObj);
      
      const callArgs = axiosStub.getCall(0).args[0];
      expect(callArgs.data.message).to.include('Error with object:');
      expect(callArgs.data.message).to.include('{"name":"Test","value":123}');
    });

    it('should handle Error objects', () => {
      const testError = new Error('Test error object');
      console.ext('Got error:', testError);
      
      const callArgs = axiosStub.getCall(0).args[0];
      expect(callArgs.data.message).to.include('Got error:');
      expect(callArgs.data.message).to.include('Test error object');
    });

    it('should include context if provided', () => {
      // Initialize with context provider
      consoleExt.init('test-api-key', {
        contextProvider: () => ({ env: 'test', userId: '123' })
      });
      
      console.ext('Error with context');
      
      const callArgs = axiosStub.getCall(0).args[0];
      expect(callArgs.data.context).to.deep.equal({ env: 'test', userId: '123' });
    });

    it('should not send notification if disabled', () => {
      consoleExt.init('test-api-key', { enabled: false });
      
      console.ext('This should not be sent');
      
      expect(axiosStub.called).to.be.false;
    });
  });
});