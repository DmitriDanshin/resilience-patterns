import React, { useState, useEffect, useRef } from 'react';

const TimeoutVisualizer = () => {
  // Состояния запроса
  const requestStates = {
    IDLE: 'Ожидание',
    IN_PROGRESS: 'Выполняется',
    COMPLETED: 'Завершен',
    TIMEOUT: 'Таймаут',
    CANCELLED: 'Отменен'
  };

  // Начальное состояние и настройки
  const [requestState, setRequestState] = useState(requestStates.IDLE);
  const [logs, setLogs] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [totalTimeouts, setTotalTimeouts] = useState(0);
  const [totalSuccess, setTotalSuccess] = useState(0);
  
  // Настройки таймаутов
  const [timeoutDuration, setTimeoutDuration] = useState(5);
  const [requestDuration, setRequestDuration] = useState(3);
  
  // Для управления таймерами
  const timerRefs = useRef([]);

  // Функция для добавления сообщений в лог
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`${timestamp}: ${message}`, ...prevLogs.slice(0, 9)]);
  };

  // Функция создания нового запроса
  const createRequest = () => {
    const requestId = Date.now();
    const newRequest = {
      id: requestId,
      startTime: Date.now(),
      status: requestStates.IN_PROGRESS,
      timeRemaining: timeoutDuration,
      processingTime: requestDuration,
      processingRemaining: requestDuration
    };
    
    setActiveRequests(prev => [...prev, newRequest]);
    addLog(`🚀 Запрос ${requestId} начат (Таймаут: ${timeoutDuration}с, Обработка: ${requestDuration}с)`);
    
    // Создание таймера для таймаута
    const timeoutTimer = setInterval(() => {
      setActiveRequests(prevRequests => 
        prevRequests.map(req => {
          if (req.id === requestId) {
            // Обновляем таймер таймаута
            const newTimeRemaining = req.timeRemaining - 1;
            
            // Проверяем, не истек ли таймаут
            if (newTimeRemaining <= 0 && req.status === requestStates.IN_PROGRESS) {
              clearInterval(timeoutTimer);
              clearInterval(processingTimer);
              addLog(`⏰ Таймаут запроса ${requestId}`);
              setTotalTimeouts(prev => prev + 1);
              return { ...req, timeRemaining: 0, status: requestStates.TIMEOUT };
            }
            
            return { ...req, timeRemaining: newTimeRemaining };
          }
          return req;
        })
      );
    }, 1000);
    
    // Создание таймера для процесса обработки
    const processingTimer = setInterval(() => {
      setActiveRequests(prevRequests => 
        prevRequests.map(req => {
          if (req.id === requestId && req.status === requestStates.IN_PROGRESS) {
            // Обновляем таймер обработки
            const newProcessingRemaining = req.processingRemaining - 1;
            
            // Проверяем, не завершилась ли обработка
            if (newProcessingRemaining <= 0) {
              clearInterval(timeoutTimer);
              clearInterval(processingTimer);
              addLog(`✅ Запрос ${requestId} успешно завершен`);
              setTotalSuccess(prev => prev + 1);
              return { ...req, processingRemaining: 0, status: requestStates.COMPLETED };
            }
            
            return { ...req, processingRemaining: newProcessingRemaining };
          }
          return req;
        })
      );
    }, 1000);
    
    // Сохраняем ссылки на таймеры для очистки
    timerRefs.current.push(timeoutTimer, processingTimer);
  };

  // Функция отмены запроса
  const cancelRequest = (requestId) => {
    setActiveRequests(prevRequests => 
      prevRequests.map(req => {
        if (req.id === requestId && req.status === requestStates.IN_PROGRESS) {
          addLog(`🛑 Запрос ${requestId} отменен пользователем`);
          return { ...req, status: requestStates.CANCELLED };
        }
        return req;
      })
    );
  };

  // Функция для очистки устаревших запросов
  const clearCompletedRequests = () => {
    setActiveRequests(prevRequests => 
      prevRequests.filter(req => 
        req.status === requestStates.IN_PROGRESS || 
        // Оставляем только недавно завершенные запросы (в течение последних 10 секунд)
        (Date.now() - req.startTime < 10000)
      )
    );
  };

  // Периодически очищаем завершенные запросы
  useEffect(() => {
    const cleanupInterval = setInterval(clearCompletedRequests, 10000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Очистка таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timer => clearInterval(timer));
    };
  }, []);

  // Сбросить симуляцию
  const resetSimulation = () => {
    // Очищаем все активные таймеры
    timerRefs.current.forEach(timer => clearInterval(timer));
    timerRefs.current = [];
    
    setActiveRequests([]);
    setLogs([]);
    setTotalTimeouts(0);
    setTotalSuccess(0);
    addLog('🔄 Симуляция сброшена');
  };

  // Получить цвет для текущего состояния запроса
  const getStatusColor = (status) => {
    switch(status) {
      case requestStates.IN_PROGRESS: return 'bg-blue-500';
      case requestStates.COMPLETED: return 'bg-green-500';
      case requestStates.TIMEOUT: return 'bg-red-500';
      case requestStates.CANCELLED: return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  // Получить текстовый цвет для статуса
  const getStatusTextColor = (status) => {
    switch(status) {
      case requestStates.IN_PROGRESS: return 'text-blue-600';
      case requestStates.COMPLETED: return 'text-green-600';
      case requestStates.TIMEOUT: return 'text-red-600';
      case requestStates.CANCELLED: return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Симуляция паттерна Timeout</h1>
      
      {/* Настройки таймаута */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Таймаут запроса (секунд):</label>
          <input 
            type="range" 
            min="1" 
            max="15" 
            value={timeoutDuration} 
            onChange={(e) => setTimeoutDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>1с</span>
            <span>{timeoutDuration}с</span>
            <span>15с</span>
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Длительность обработки (секунд):</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={requestDuration} 
            onChange={(e) => setRequestDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>1с</span>
            <span>{requestDuration}с</span>
            <span>10с</span>
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
                  {request.status === requestStates.IN_PROGRESS && (
                    <button 
                      onClick={() => cancelRequest(request.id)}
                      className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300"
                    >
                      Отменить
                    </button>
                  )}
                </div>
                
                {/* Прогресс таймаута */}
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Таймаут:</span>
                    <span>{request.timeRemaining}с / {timeoutDuration}с</span>
                  </div>
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${((timeoutDuration - request.timeRemaining) / timeoutDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Прогресс обработки */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Обработка:</span>
                    <span>{requestDuration - request.processingRemaining}с / {requestDuration}с</span>
                  </div>
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${((requestDuration - request.processingRemaining) / requestDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
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
          <p>Таймаутов: <span className="font-medium text-red-600">{totalTimeouts}</span></p>
          <p>Активных запросов: <span className="font-medium">{activeRequests.filter(r => r.status === requestStates.IN_PROGRESS).length}</span></p>
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
      
      {/* Описание паттерна Timeout */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Как работает паттерн Timeout:</h3>
        <p><strong>Таймаут</strong> - механизм защиты от зависания запросов, который автоматически прерывает запрос, если он выполняется дольше установленного времени.</p>
        <p><strong>Основные компоненты:</strong></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Таймер таймаута - отсчитывает максимально допустимое время выполнения запроса</li>
          <li>Асинхронный запрос - операция, которая может занять неопределенное время</li>
          <li>Обработчик таймаута - логика, выполняемая при истечении времени</li>
        </ul>
        <p className="mt-2"><strong>Преимущества:</strong> предотвращение блокировки системы из-за медленных запросов, улучшение пользовательского опыта, защита от утечек ресурсов.</p>
      </div>
    </div>
  );
};

export default TimeoutVisualizer;