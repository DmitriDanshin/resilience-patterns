import React, { useState } from 'react';

// Компонент визуализации Circuit Breaker
const CircuitBreakerVisualizer = () => {
  // Состояния Circuit Breaker
  const states = {
    CLOSED: 'Закрытый',
    OPEN: 'Открытый',
    HALF_OPEN: 'Полуоткрытый'
  };

  // Начальное состояние и настройки
  const [currentState, setCurrentState] = useState(states.CLOSED);
  const [failureCount, setFailureCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Настройки Circuit Breaker
  const failureThreshold = 5;
  const resetTimeoutSeconds = 10;
  const maxTestRequests = 3;
  const [testRequestsRemaining, setTestRequestsRemaining] = useState(maxTestRequests);

  // Функция для добавления сообщений в лог
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`${timestamp}: ${message}`, ...prevLogs.slice(0, 9)]);
  };

  // Симуляция успешного запроса
  const simulateSuccess = () => {
    if (currentState === states.CLOSED) {
      setSuccessCount(prevCount => prevCount + 1);
      addLog('✅ Успешный запрос обработан');
    } else if (currentState === states.HALF_OPEN && testRequestsRemaining > 0) {
      setSuccessCount(prevCount => prevCount + 1);
      setTestRequestsRemaining(prev => prev - 1);
      addLog(`✅ Тестовый запрос успешен (осталось ${testRequestsRemaining - 1})`);
      
      // Если все тестовые запросы успешны, возвращаемся в закрытое состояние
      if (testRequestsRemaining === 1) {
        setCurrentState(states.CLOSED);
        setFailureCount(0);
        addLog('🔄 Circuit Breaker переходит в ЗАКРЫТОЕ состояние');
      }
    } else if (currentState === states.OPEN) {
      addLog('❌ Запрос отклонен (Circuit Breaker ОТКРЫТ)');
    }
  };

  // Симуляция неудачного запроса
  const simulateFailure = () => {
    if (currentState === states.CLOSED) {
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      addLog(`❌ Ошибка запроса (${newFailureCount}/${failureThreshold})`);
      
      // Проверяем, не превышен ли порог ошибок
      if (newFailureCount >= failureThreshold) {
        setCurrentState(states.OPEN);
        setIsTimerActive(true);
        setTimeRemaining(resetTimeoutSeconds);
        addLog(`🔄 Circuit Breaker переходит в ОТКРЫТОЕ состояние на ${resetTimeoutSeconds} секунд`);
      }
    } else if (currentState === states.HALF_OPEN && testRequestsRemaining > 0) {
      setTestRequestsRemaining(prev => prev - 1);
      addLog(`❌ Тестовый запрос неудачен (осталось ${testRequestsRemaining - 1})`);
      
      // Если хотя бы один тестовый запрос неудачен, возвращаемся в открытое состояние
      setCurrentState(states.OPEN);
      setIsTimerActive(true);
      setTimeRemaining(resetTimeoutSeconds);
      addLog(`🔄 Circuit Breaker возвращается в ОТКРЫТОЕ состояние на ${resetTimeoutSeconds} секунд`);
    } else if (currentState === states.OPEN) {
      addLog('❌ Запрос отклонен (Circuit Breaker ОТКРЫТ)');
    }
  };

  // Сбросить симуляцию
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

  // Обновление таймера
  React.useEffect(() => {
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
  }, [isTimerActive, timeRemaining]);

  // Получить цвет для текущего состояния
  const getStateColor = () => {
    switch(currentState) {
      case states.CLOSED: return 'bg-green-500';
      case states.OPEN: return 'bg-red-500';
      case states.HALF_OPEN: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Circuit Breaker (Прерыватель цепи)</h2>
      
      {/* Визуализация состояния */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${currentState === states.CLOSED ? 'ring-4 ring-green-500 bg-green-100' : 'bg-gray-100'}`}>
            <h3 className="font-semibold">Закрытый</h3>
            <p className="text-sm mt-1">Запросы проходят напрямую</p>
          </div>
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${currentState === states.OPEN ? 'ring-4 ring-red-500 bg-red-100' : 'bg-gray-100'}`}>
            <h3 className="font-semibold">Открытый</h3>
            <p className="text-sm mt-1">Все запросы отклоняются</p>
            {currentState === states.OPEN && timeRemaining > 0 && (
              <p className="font-bold mt-1">{timeRemaining}с</p>
            )}
          </div>
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${currentState === states.HALF_OPEN ? 'ring-4 ring-yellow-500 bg-yellow-100' : 'bg-gray-100'}`}>
            <h3 className="font-semibold">Полуоткрытый</h3>
            <p className="text-sm mt-1">Тестовые запросы: {testRequestsRemaining}/{maxTestRequests}</p>
          </div>
        </div>
        
        <div className="bg-gray-200 h-2 rounded-full mb-2">
          <div className={`h-2 rounded-full ${getStateColor()}`} style={{ width: `${(failureCount / failureThreshold) * 100}%` }}></div>
        </div>
        <p className="text-sm text-gray-600 text-center">Ошибки: {failureCount}/{failureThreshold}</p>
      </div>
      
      {/* Кнопки управления */}
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={simulateSuccess} 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Успешный запрос
        </button>
        <button 
          onClick={simulateFailure} 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Неудачный запрос
        </button>
        <button 
          onClick={resetSimulation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Сбросить
        </button>
      </div>
      
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Статистика:</h3>
          <p>Текущее состояние: <span className="font-medium">{currentState}</span></p>
          <p>Успешных запросов: <span className="font-medium">{successCount}</span></p>
          <p>Неудачных запросов: <span className="font-medium">{failureCount}</span></p>
        </div>
        
        {/* Логи */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Журнал событий:</h3>
          <div className="h-40 overflow-y-auto text-sm space-y-1">
            {logs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      </div>
      
      {/* Описание состояний */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Как работает Circuit Breaker:</h3>
        <p><strong>Закрытый:</strong> Нормальная работа. Запросы проходят к сервису. При достижении {failureThreshold} ошибок переходит в Открытое состояние.</p>
        <p><strong>Открытый:</strong> Все запросы отклоняются. После {resetTimeoutSeconds} секунд переходит в Полуоткрытое состояние.</p>
        <p><strong>Полуоткрытый:</strong> Разрешено {maxTestRequests} тестовых запросов. Если все успешны — возврат в Закрытое состояние. При любой ошибке — возврат в Открытое.</p>
      </div>
    </div>
  );
};

// Пустые компоненты для других паттернов (заглушки)
const BulkheadVisualizer = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Bulkhead (Переборка)</h2>
      <div className="p-8 bg-gray-100 rounded-lg text-center">
        <p className="text-lg">Визуализация паттерна Bulkhead в разработке...</p>
        <p className="mt-4 text-gray-600">Этот паттерн изолирует элементы системы друг от друга, чтобы сбой в одной части не повлиял на остальные.</p>
      </div>
    </div>
  );
};

const RetryVisualizer = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Retry (Повторная попытка)</h2>
      <div className="p-8 bg-gray-100 rounded-lg text-center">
        <p className="text-lg">Визуализация паттерна Retry в разработке...</p>
        <p className="mt-4 text-gray-600">Этот паттерн автоматически повторяет операцию, которая завершилась сбоем, в ожидании, что она может быть успешной при следующей попытке.</p>
      </div>
    </div>
  );
};

const TimeoutVisualizer = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Timeout (Таймаут)</h2>
      <div className="p-8 bg-gray-100 rounded-lg text-center">
        <p className="text-lg">Визуализация паттерна Timeout в разработке...</p>
        <p className="mt-4 text-gray-600">Этот паттерн устанавливает максимальное время ожидания ответа от сервиса, после которого операция считается неудачной.</p>
      </div>
    </div>
  );
};

const FallbackVisualizer = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Fallback (Резервный вариант)</h2>
      <div className="p-8 bg-gray-100 rounded-lg text-center">
        <p className="text-lg">Визуализация паттерна Fallback в разработке...</p>
        <p className="mt-4 text-gray-600">Этот паттерн предоставляет альтернативный путь выполнения, когда основной вариант недоступен или завершается с ошибкой.</p>
      </div>
    </div>
  );
};

// Главный компонент приложения
const ResiliencePatternsApp = () => {
  const [activePattern, setActivePattern] = useState('circuit-breaker');
  
  // Определяем, какой компонент отображать
  const renderPatternComponent = () => {
    switch(activePattern) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Паттерны отказоустойчивости в распределенных системах</h1>
        
        {/* Навигация по паттернам */}
        <div className="flex justify-center mb-8 overflow-x-auto py-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActivePattern('circuit-breaker')}
              className={`px-4 py-2 rounded-lg ${activePattern === 'circuit-breaker' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Circuit Breaker
            </button>
            <button
              onClick={() => setActivePattern('bulkhead')}
              className={`px-4 py-2 rounded-lg ${activePattern === 'bulkhead' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Bulkhead
            </button>
            <button
              onClick={() => setActivePattern('retry')}
              className={`px-4 py-2 rounded-lg ${activePattern === 'retry' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Retry
            </button>
            <button
              onClick={() => setActivePattern('timeout')}
              className={`px-4 py-2 rounded-lg ${activePattern === 'timeout' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Timeout
            </button>
            <button
              onClick={() => setActivePattern('fallback')}
              className={`px-4 py-2 rounded-lg ${activePattern === 'fallback' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              Fallback
            </button>
          </div>
        </div>
        
        {/* Отображение выбранного компонента */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {renderPatternComponent()}
        </div>
        
        {/* Информация о проекте */}
        <div className="mt-8 text-center text-gray-600">
          <p>Интерактивная визуализация паттернов отказоустойчивости</p>
          <p className="mt-2">© 2025 Resilience Patterns Visualizer</p>
        </div>
      </div>
    </div>
  );
};

export default ResiliencePatternsApp;