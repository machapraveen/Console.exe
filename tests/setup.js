// tests/setup.js
const { configure } = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');
const { JSDOM } = require('jsdom');

// Configure Enzyme with React 17 adapter
configure({ adapter: new Adapter() });

// Set up DOM environment for testing
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// Set up the global environment to mimic a browser
global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};

// Add window properties to global
Object.keys(window).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = window[property];
  }
});

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Suppress React warning about act()
global.console.error = (...args) => {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('Warning: An update to') && errorMessage.includes('inside a test was not wrapped in act')) {
    return;
  }
  return console.error(...args);
};

// Add polyfills if needed
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn();
}