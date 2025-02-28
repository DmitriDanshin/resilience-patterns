import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CircuitBreakerVisualizer from './CircuitBreakerVisualizer';
import BulkheadVisualizer from './BulkheadVisualizer';
import RetryVisualizer from './RetryVisualizer';
import TimeoutVisualizer from './TimeoutVisualizer';
import FallbackVisualizer from './FallbackVisualizer';

const ResiliencePatternsApp = () => {
  const { pattern } = useParams();
  const navigate = useNavigate();
  
  // Проверяем, является ли паттерн допустимым
  const validPatterns = ['circuit-breaker', 'bulkhead', 'retry', 'timeout', 'fallback'];
  
  // Если паттерн из URL не является допустимым, перенаправляем на circuit-breaker
  useEffect(() => {
    if (!validPatterns.includes(pattern)) {
      navigate('/circuit-breaker', { replace: true });
    }
  }, [pattern, navigate]);

  // Функция для рендеринга компонента выбранного паттерна
  const renderPatternComponent = () => {
    switch (pattern) {
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

  // Обработчик изменения паттерна
  const handlePatternChange = (newPattern) => {
    navigate(`/${newPattern}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Паттерны устойчивости</h1>
      
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
           <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              pattern === 'timeout'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handlePatternChange('timeout')}
          >
            Timeout
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              pattern === 'retry'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handlePatternChange('retry')}
          >
            Retry
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border ${
              pattern === 'circuit-breaker'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } rounded-l-lg`}
            onClick={() => handlePatternChange('circuit-breaker')}
          >
            Circuit Breaker
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              pattern === 'bulkhead'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handlePatternChange('bulkhead')}
          >
            Bulkhead
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              pattern === 'fallback'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } rounded-r-lg`}
            onClick={() => handlePatternChange('fallback')}
          >
            Fallback
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {renderPatternComponent()}
      </div>
    </div>
  );
};

export default ResiliencePatternsApp;