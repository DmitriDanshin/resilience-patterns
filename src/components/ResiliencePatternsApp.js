import React, { useState } from 'react';
import CircuitBreakerVisualizer from './CircuitBreakerVisualizer';
import BulkheadVisualizer from './BulkheadVisualizer';
import RetryVisualizer from './RetryVisualizer';
import TimeoutVisualizer from './TimeoutVisualizer';
import FallbackVisualizer from './FallbackVisualizer';

const ResiliencePatternsApp = () => {
  const [activePattern, setActivePattern] = useState('circuit-breaker');

  const renderPatternComponent = () => {
    switch (activePattern) {
      case 'circuit-breaker':
        return <CircuitBreakerVisualizer />;
      case 'bulkhead':
        return <BulkheadVisualizer />;
      case 'retry':
        return <RetryVisualizer />;
      case 'timeout':
        return <TimeoutVisualizer />;
      case 'fallback':
        return <FallbackVisualizer />;
      default:
        return <CircuitBreakerVisualizer />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Resilience Patterns Visualizer</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            className={`px-4 py-2 rounded-full ${activePattern === 'circuit-breaker' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActivePattern('circuit-breaker')}
          >
            Circuit Breaker
          </button>
          
          <button 
            className={`px-4 py-2 rounded-full ${activePattern === 'bulkhead' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActivePattern('bulkhead')}
          >
            Bulkhead
          </button>
          
          <button 
            className={`px-4 py-2 rounded-full ${activePattern === 'retry' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActivePattern('retry')}
          >
            Retry
          </button>
          
          <button 
            className={`px-4 py-2 rounded-full ${activePattern === 'timeout' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActivePattern('timeout')}
          >
            Timeout
          </button>
          
          <button 
            className={`px-4 py-2 rounded-full ${activePattern === 'fallback' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActivePattern('fallback')}
          >
            Fallback
          </button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {renderPatternComponent()}
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Resilience Patterns Visualizer © 2025 - Интерактивный демонстратор паттернов устойчивости</p>
      </div>
    </div>
  );
};

export default ResiliencePatternsApp;