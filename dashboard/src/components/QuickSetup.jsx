// src/components/QuickSetup.jsx
import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const QuickSetup = ({ apiKey }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setupCode = `// Install the package
npm install console-ext

// Add one line to your app
console.setKey('${apiKey || 'YOUR_API_KEY'}');

// Then use it to get notified about errors
try {
  // Your code here
} catch (error) {
  console.ext('Critical error:', error);
}`;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Quick Setup</h2>
      
      {!apiKey ? (
        <div className="py-4 text-gray-500">
          <p>Complete your account setup to get your API key.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Add Console.ext to your application with just a few lines of code:
          </p>
          
          <div className="relative">
            <pre className="bg-gray-800 text-white text-xs p-4 rounded-md overflow-x-auto">
              {setupCode}
            </pre>
            
            <CopyToClipboard text={setupCode} onCopy={handleCopy}>
              <button
                className="absolute top-2 right-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded px-2 py-1 text-xs text-white"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </CopyToClipboard>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Your API Key: <span className="font-mono text-xs bg-gray-100 p-1 rounded">{apiKey}</span></p>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickSetup;