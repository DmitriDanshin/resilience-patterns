import React, { useState, useEffect } from 'react';

const states = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

const CircuitBreakerVisualizer = () => {
  const failureThreshold = 3;
  const resetTimeoutSeconds = 10;
  const maxTestRequests = 3;

  const [currentState, setCurrentState] = useState(states.CLOSED);
  const [failureCount, setFailureCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testRequestsRemaining, setTestRequestsRemaining] = useState(maxTestRequests);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`${timestamp}: ${message}`, ...prevLogs.slice(0, 9)]);
  };

  const simulateSuccess = () => {
    if (currentState === states.CLOSED) {
      setSuccessCount(prevCount => prevCount + 1);
      addLog('✅ Успешный запрос обработан');
    } else if (currentState === states.HALF_OPEN) {
      setTestRequestsRemaining(prev => prev - 1);
      addLog(`✅ Тестовый запрос успешен (осталось ${testRequestsRemaining - 1})`);
      
      if (testRequestsRemaining <= 1) {
        setCurrentState(states.CLOSED);
        setFailureCount(0);
        addLog('🔄 Circuit Breaker переходит в ЗАКРЫТОЕ состояние');
      }
    } else {
      addLog('❌ Запрос отклонен (Circuit Breaker ОТКРЫТ)');
    }
  };

  const simulateFailure = () => {
    if (currentState === states.CLOSED) {
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      addLog(`❌ Ошибка запроса (${newFailureCount}/${failureThreshold})`);
      
      if (newFailureCount >= failureThreshold) {
        setCurrentState(states.OPEN);
        setIsTimerActive(true);
        setTimeRemaining(resetTimeoutSeconds);
        addLog(`🔄 Circuit Breaker переходит в ОТКРЫТОЕ состояние на ${resetTimeoutSeconds} секунд`);
      }
    } else if (currentState === states.HALF_OPEN) {
      setTestRequestsRemaining(prev => prev - 1);
      addLog(`❌ Тестовый запрос неудачен (осталось ${testRequestsRemaining - 1})`);
      setCurrentState(states.OPEN);
      setIsTimerActive(true);
      setTimeRemaining(resetTimeoutSeconds);
      addLog(`🔄 Circuit Breaker возвращается в ОТКРЫТОЕ состояние на ${resetTimeoutSeconds} секунд`);
    }
  };

  const resetSimulation = () => {
    setCurrentState(states.CLOSED);
    setFailureCount(0);
    setSuccessCount(0);
    setIsTimerActive(false);
    setTimeRemaining(0);
    setTestRequestsRemaining(maxTestRequests);
    setLogs([]);
    addLog('🔄 Симуляция сброшена');
  };

  useEffect(() => {
    let timer;
    if (isTimerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isTimerActive && timeRemaining === 0) {
      setIsTimerActive(false);
      setCurrentState(states.HALF_OPEN);
      setTestRequestsRemaining(maxTestRequests);
      addLog(`🔄 Circuit Breaker переходит в ПОЛУОТКРЫТОЕ состояние, разрешено ${maxTestRequests} тестовых запросов`);
    }
    
    return () => clearTimeout(timer);
  }, [isTimerActive, timeRemaining, maxTestRequests]);

  const getStateColor = () => {
    switch (currentState) {
      case states.CLOSED: return 'bg-green-500';
      case states.OPEN: return 'bg-red-500';
      case states.HALF_OPEN: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Circuit Breaker Pattern</h2>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className={`w-4 h-4 rounded-full ${getStateColor()} mr-2`}></div>
          <span className="font-semibold">State: {currentState}</span>
          {isTimerActive && <span className="ml-2">({timeRemaining}s)</span>}
        </div>
        
        <div className="bg-gray-200 h-4 rounded-full mb-4">
          <div className={`h-2 rounded-full ${getStateColor()}`} style={{ width: `${(failureCount / failureThreshold) * 100}%` }}></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-lg font-semibold">Failures: {failureCount}/{failureThreshold}</div>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-lg font-semibold">Successes: {successCount}</div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={simulateSuccess} 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Simulate Success
        </button>
        <button 
          onClick={simulateFailure} 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Simulate Failure
        </button>
        <button 
          onClick={resetSimulation} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
        <h3 className="font-semibold mb-2">Logs:</h3>
        <div className="space-y-1 text-sm">
          {logs.map((log, index) => (
            <div key={index} className="border-b border-gray-200 pb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CircuitBreakerVisualizer;