import React, { useState, useEffect, useRef } from 'react';
import { uniqueNamesGenerator, adjectives, colors, names } from 'unique-names-generator';

const RetryVisualizer = () => {
  
  const requestStates = {
    IDLE: 'Ожидание',
    IN_PROGRESS: 'Выполняется',
    SUCCESS: 'Успешно',
    FAILED: 'Сбой',
    RETRYING: 'Повторная попытка',
    EXHAUSTED: 'Попытки исчерпаны'
  };

  // Стратегии повторных попыток
  const retryStrategies = {
    FIXED: 'Фиксированный интервал',
    EXPONENTIAL: 'Экспоненциальная задержка',
    EXPONENTIAL_JITTER: 'Экспоненциальная с джиттером',
    RANDOM: 'Случайная задержка'
  };

  // Начальное состояние и настройки
  const [requestState, setRequestState] = useState(requestStates.IDLE);
  const [logs, setLogs] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [totalFailure, setTotalFailure] = useState(0);
  
  // Настройки Retry
  const [maxRetries, setMaxRetries] = useState(3);
  const [baseDelay, setBaseDelay] = useState(2);
  const [retryStrategy, setRetryStrategy] = useState(retryStrategies.FIXED);
  const [successProbability, setSuccessProbability] = useState(50);
  
  // Для управления таймерами
  const timerRefs = useRef([]);

  // Функция для добавления сообщений в лог
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`${timestamp}: ${message}`, ...prevLogs.slice(0, 9)]);
  };

  // Функция для вычисления задержки на основе выбранной стратегии
  const calculateDelay = (attempt, strategy) => {
    switch(strategy) {
      case retryStrategies.FIXED:
        return baseDelay;
      case retryStrategies.EXPONENTIAL:
        return baseDelay * Math.pow(2, attempt - 1);
      case retryStrategies.EXPONENTIAL_JITTER: {
        // Экспоненциальная задержка с джиттером (случайность)
        const expDelay = baseDelay * Math.pow(2, attempt - 1);
        // Добавляем случайность от 0 до 50% от вычисленной задержки
        const jitter = Math.random() * (expDelay * 0.5);
        return expDelay + jitter;
      }
      case retryStrategies.RANDOM:
        return baseDelay + Math.random() * baseDelay * 2; // от baseDelay до 3*baseDelay
      default:
        return baseDelay;
    }
  };

  // Симуляция попытки запроса с успехом на основе вероятности
  const attemptRequest = (requestId, currentAttempt = 1, isRetry = false) => {
    // Находим текущий запрос
    setActiveRequests(prevRequests => 
      prevRequests.map(req => {
        if (req.id === requestId) {
          // Устанавливаем состояние и текущую попытку
          return { 
            ...req, 
            currentAttempt, 
            status: isRetry ? requestStates.RETRYING : requestStates.IN_PROGRESS, 
            isProcessing: true,
            processingTimeRemaining: 2 // 2 секунды на обработку
          };
        }
        return req;
      })
    );

    const logPrefix = isRetry ? `🔄 Повторная попытка ${currentAttempt}/${maxRetries}` : '🚀 Первая попытка';
    addLog(`${logPrefix} для запроса ${requestId}`);

    // Таймер для симуляции времени обработки запроса
    const processingTimer = setInterval(() => {
      setActiveRequests(prevRequests => {
        const updatedRequests = prevRequests.map(req => {
          if (req.id === requestId && req.isProcessing) {
            const newTimeRemaining = req.processingTimeRemaining - 1;
            
            // Если обработка завершена, проверяем результат
            if (newTimeRemaining <= 0) {
              clearInterval(processingTimer);
              // Определяем успех на основе вероятности
              const isSuccess = Math.random() * 100 < successProbability;
              
              if (isSuccess) {
                addLog(`✅ Запрос ${requestId} выполнен успешно (попытка ${currentAttempt})`);
                setTotalSuccess(prev => prev + 1);
                return { 
                  ...req, 
                  isProcessing: false, 
                  status: requestStates.SUCCESS,
                  processingTimeRemaining: 0
                };
              } else {
                // Неудача - проверяем, можно ли повторить
                addLog(`❌ Сбой запроса ${requestId} (попытка ${currentAttempt})`);
                
                if (currentAttempt < maxRetries) {
                  // Рассчитываем задержку для следующей попытки
                  const delay = calculateDelay(currentAttempt, retryStrategy);
                  addLog(`⏱️ Ожидание ${delay.toFixed(1)}с перед следующей попыткой`);
                  
                  // Устанавливаем состояние ожидания повторной попытки
                  const retryTimer = setTimeout(() => {
                    attemptRequest(requestId, currentAttempt + 1, true);
                  }, delay * 1000);
                  
                  timerRefs.current.push(retryTimer);
                  
                  return { 
                    ...req, 
                    isProcessing: false, 
                    status: requestStates.FAILED,
                    retryCountdown: delay,
                    processingTimeRemaining: 0
                  };
                } else {
                  // Исчерпаны все попытки
                  addLog(`💥 Все попытки для запроса ${requestId} исчерпаны`);
                  setTotalFailure(prev => prev + 1);
                  return { 
                    ...req, 
                    isProcessing: false, 
                    status: requestStates.EXHAUSTED,
                    processingTimeRemaining: 0
                  };
                }
              }
            }
            
            // Продолжаем обработку
            return { ...req, processingTimeRemaining: newTimeRemaining };
          }
          return req;
        });
        
        return updatedRequests;
      });
    }, 1000);
    
    timerRefs.current.push(processingTimer);
  };

  // Функция обновления таймеров обратного отсчета для повторных попыток
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setActiveRequests(prevRequests => 
        prevRequests.map(req => {
          if (req.retryCountdown && req.retryCountdown > 0) {
            return {
              ...req,
              retryCountdown: +(req.retryCountdown - 0.1).toFixed(1)
            };
          }
          return req;
        })
      );
    }, 100);
    
    timerRefs.current.push(countdownTimer);
    return () => clearInterval(countdownTimer);
  }, []);

  // Функция создания нового запроса
  const createRequest = () => {
    const requestId = uniqueNamesGenerator({ dictionaries: [adjectives, colors, names] }).toLowerCase();
    const newRequest = {
      id: requestId,
      startTime: Date.now(),
      status: requestStates.IDLE,
      currentAttempt: 0,
      maxRetries: maxRetries,
      retryStrategy: retryStrategy,
      isProcessing: false
    };
    
    setActiveRequests(prev => [...prev, newRequest]);
    attemptRequest(requestId);
  };

  // Функция для очистки устаревших запросов
  const clearCompletedRequests = () => {
    setActiveRequests(prevRequests => 
      prevRequests.filter(req => {
        // Оставляем незавершенные и недавно завершенные запросы (в течение последних 10 секунд)
        const isActive = req.status === requestStates.IN_PROGRESS || 
                        req.status === requestStates.RETRYING || 
                        req.retryCountdown > 0;
        const isRecent = (Date.now() - req.startTime) < 30000; // 30 секунд
        return isActive || isRecent;
      })
    );
  };

  // Периодически очищаем завершенные запросы
  useEffect(() => {
    const cleanupInterval = setInterval(clearCompletedRequests, 15000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Очистка таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Сбросить симуляцию
  const resetSimulation = () => {
    // Очищаем все активные таймеры
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current = [];
    
    setActiveRequests([]);
    setLogs([]);
    setTotalSuccess(0);
    setTotalFailure(0);
    addLog('🔄 Симуляция сброшена');
  };

  // Получить цвет для текущего состояния запроса
  const getStatusColor = (status) => {
    switch(status) {
      case requestStates.IN_PROGRESS:
      case requestStates.RETRYING:
        return 'bg-blue-500';
      case requestStates.SUCCESS:
        return 'bg-green-500';
      case requestStates.FAILED:
        return 'bg-yellow-500';
      case requestStates.EXHAUSTED:
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Получить текстовый цвет для статуса
  const getStatusTextColor = (status) => {
    switch(status) {
      case requestStates.IN_PROGRESS:
      case requestStates.RETRYING:
        return 'text-blue-600';
      case requestStates.SUCCESS:
        return 'text-green-600';
      case requestStates.FAILED:
        return 'text-yellow-600';
      case requestStates.EXHAUSTED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Симуляция паттерна Retry</h1>
      
      {/* Настройки Retry */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Максимальное количество повторных попыток:</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={maxRetries} 
            onChange={(e) => setMaxRetries(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>1</span>
            <span>{maxRetries}</span>
            <span>5</span>
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Базовая задержка (секунд):</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={baseDelay} 
            onChange={(e) => setBaseDelay(parseInt(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>1с</span>
            <span>{baseDelay}с</span>
            <span>5с</span>
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Стратегия повторных попыток:</label>
          <select 
            value={retryStrategy} 
            onChange={(e) => setRetryStrategy(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            {Object.entries(retryStrategies).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Вероятность успеха (%):</label>
          <input 
            type="range" 
            min="10" 
            max="90" 
            value={successProbability} 
            onChange={(e) => setSuccessProbability(parseInt(e.target.value))}
            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>10%</span>
            <span>{successProbability}%</span>
            <span>90%</span>
          </div>
        </div>
      </div>
      
      {/* Кнопки управления */}
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={createRequest} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Отправить запрос
        </button>
        <button 
          onClick={resetSimulation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Сбросить
        </button>
      </div>
      
      {/* Активные запросы */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Активные и недавние запросы:</h3>
        {activeRequests.length === 0 ? (
          <p className="text-center text-gray-500 my-4">Нет активных запросов</p>
        ) : (
          <div className="space-y-4">
            {activeRequests.map(request => (
              <div key={request.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="font-medium">Запрос #{request.id.toString().slice(-4)}</span>
                    <span className={`ml-2 font-semibold ${getStatusTextColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                
                {/* Прогресс попыток */}
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Попытки:</span>
                    <span>{request.currentAttempt}/{maxRetries + 1}</span>
                  </div>
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div 
                      className={`${getStatusColor(request.status)} h-2 rounded-full transition-all duration-300`} 
                      style={{ width: `${(request.currentAttempt / (maxRetries + 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Прогресс обработки текущей попытки */}
                {request.isProcessing && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Обработка:</span>
                      <span>{2 - request.processingTimeRemaining}с / 2с</span>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${((2 - request.processingTimeRemaining) / 2) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Обратный отсчет до следующей попытки */}
                {request.retryCountdown > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Ожидание следующей попытки:</span>
                      <span>{request.retryCountdown.toFixed(1)}с</span>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-100" 
                        style={{ width: `${(1 - (request.retryCountdown / calculateDelay(request.currentAttempt, request.retryStrategy))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Результат */}
                {(request.status === requestStates.SUCCESS || request.status === requestStates.EXHAUSTED) && (
                  <div className="mt-2 text-sm">
                    <span className={`font-medium ${request.status === requestStates.SUCCESS ? 'text-green-600' : 'text-red-600'}`}>
                      {request.status === requestStates.SUCCESS 
                        ? `✅ Успешно выполнен с ${request.currentAttempt} попытки` 
                        : `❌ Не удалось выполнить после ${maxRetries + 1} попыток`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Статистика и логи */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Статистика:</h3>
          <p>Успешных запросов: <span className="font-medium text-green-600">{totalSuccess}</span></p>
          <p>Неудачных запросов: <span className="font-medium text-red-600">{totalFailure}</span></p>
          <p>Активных запросов: <span className="font-medium">{activeRequests.filter(r => r.status !== requestStates.SUCCESS && r.status !== requestStates.EXHAUSTED).length}</span></p>
          
          {/* Дополнительная статистика по стратегии */}
          <div className="mt-3 text-sm bg-white p-2 rounded">
            <p className="font-medium">Текущая стратегия: {retryStrategy}</p>
                          <p className="text-xs text-gray-600 mt-1">
              {retryStrategy === retryStrategies.FIXED 
                ? `Все повторные попытки выполняются через фиксированный интервал в ${baseDelay} секунд`
                : retryStrategy === retryStrategies.EXPONENTIAL
                  ? `Интервалы между попытками: ${[...Array(maxRetries)].map((_, i) => (baseDelay * Math.pow(2, i)).toFixed(1)).join(', ')} секунд`
                  : retryStrategy === retryStrategies.EXPONENTIAL_JITTER
                    ? `Экспоненциальные интервалы (${[...Array(maxRetries)].map((_, i) => (baseDelay * Math.pow(2, i)).toFixed(1)).join(', ')} с) + случайная задержка до 50%`
                    : `Случайные интервалы от ${baseDelay} до ${(baseDelay * 3).toFixed(1)} секунд`
              }
            </p>
          </div>
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
      
      {/* Описание паттерна Retry */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Как работает паттерн Retry:</h3>
        <p><strong>Retry</strong> - механизм повышения надежности, который автоматически повторяет неудачные операции по определенному алгоритму.</p>
        <p><strong>Основные стратегии:</strong></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Фиксированный интервал</strong> - повторные попытки через одинаковый промежуток времени</li>
          <li><strong>Экспоненциальная задержка</strong> - каждая следующая попытка выполняется через увеличивающийся интервал (базовая_задержка * 2<sup>попытка</sup>)</li>
          <li><strong>Экспоненциальная с джиттером</strong> - экспоненциальная задержка плюс случайная величина для предотвращения одновременных повторных попыток</li>
          <li><strong>Случайная задержка</strong> - добавление случайности для избежания эффекта "громкого хора" при одновременном восстановлении множества клиентов</li>
        </ul>
        <p className="mt-2"><strong>Преимущества:</strong> повышение устойчивости к временным сбоям, автоматическое восстановление при кратковременных ошибках, уменьшение количества ручных вмешательств.</p>
        <p className="mt-2"><strong>Недостатки:</strong> увеличение нагрузки на систему при массовых сбоях, потенциальное замедление обработки из-за ожидания повторных попыток.</p>
        <p className="mt-2"><strong>Best Practice:</strong> В реальных системах наиболее эффективной стратегией считается экспоненциальная задержка с джиттером, так как она сочетает увеличение интервалов (чтобы не перегружать нестабильную систему) со случайностью (чтобы избежать скопления запросов в одно время).</p>
      </div>
    </div>
  );
};

export default RetryVisualizer;