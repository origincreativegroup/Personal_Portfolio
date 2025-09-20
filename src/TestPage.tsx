import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page Working!</h1>
      <p className="text-lg">If you can see this, React is working properly.</p>
      <div className="mt-8 p-4 bg-blue-100 border border-blue-300 rounded">
        <h2 className="text-2xl font-semibold text-blue-800 mb-2">Debug Info:</h2>
        <ul className="text-blue-700">
          <li>• React is rendering</li>
          <li>• CSS is loading</li>
          <li>• Routing is working</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;