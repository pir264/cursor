import React from 'react';
import ReactDOM from 'react-dom/client';
import PipelineStagesHub from './PipelineStagesHub';

// Initialize React app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(PipelineStagesHub));
  } else {
    console.error('Root element not found');
  }
}
