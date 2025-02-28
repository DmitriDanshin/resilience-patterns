import React, { useState, useEffect } from 'react';

const FallbackVisualizer = () => {
  // Состояния сервиса
  const serviceStates = {
    PRIMARY: 'Основной',
    DEGRADED: 'Деградированный',
    FALLBACK: 'Запасной'
  };

  // Типы сервисов
  const serviceTypes = {
    DATABASE: 'База данных',
    CACHE: 'Кэш',
    API: 'API',
    STORAGE: 'Хранилище'
  };

  // Начальное состояние и настройки
  const [currentState, setCurrentState] = useState(serviceStates.PRIMARY);
  const [serviceType, setServiceType] = useState(serviceTypes.DATABASE);
  const [primaryHealth, setPrimaryHealth] = useState(100);
  const [logs, setLogs] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [autoFailureEnabled, setAutoFailureEnabled] = useState(false);
  
  // Параметры Fallback
  const fallbackOptions = {
    [serviceTypes.DATABASE]: {
      primary: { name: 'Основная БД', speed: 100, reliability: 99 },
      fallback: { name: 'Резервная БД', speed: 70, reliability: 95 },
      degraded: { name: 'Режим только для чтения', speed: 90, reliability: 99 }
    },
    [serviceTypes.CACHE]: {
      primary: { name: 'Redis кластер', speed: 100, reliability: 98 },
      fallback: { name: 'Локальный кэш', speed: 60, reliability: 100 },
      degraded: { name: 'Временный кэш', speed: 80, reliability: 97 }
    },
    [serviceTypes.API]: {
      primary: { name: 'Основное API', speed: 100, reliability: 97 },
      fallback: { name: 'Упрощенное API', speed: 50, reliability: 99 },
      degraded: { name: 'API с ограниченной скоростью', speed: 70, reliability: 98 }
    },
    [serviceTypes.STORAGE]: {
      primary: { name: 'Облачное хранилище', speed: 100, reliability: 99.9 },
      fallback: { name: 'Локальное хранилище', speed: 75, reliability: 98 },
      degraded: { name: 'Режим экономии трафика', speed: 85, reliability: 99.5 }
    }
  };

  // Функция для добавления сообщений в лог
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`${timestamp}: ${message}`, ...prevLogs.slice(0, 9)]);
  };

  // Получить текущую конфигурацию сервиса
  const getCurrentConfig = () => {
    const options = fallbackOptions[serviceType];
    switch(currentState) {
      case serviceStates.PRIMARY: return options.primary;
      case serviceStates.DEGRADED: return options.degraded;
      case serviceStates.FALLBACK: return options.fallback;
      default: return options.primary;
    }
  };

  // Выполнить запрос
  const executeRequest = () => {
    setRequestCount(prev => prev + 1);
    
    const config = getCurrentConfig();
    const isSuccessful = Math.random() * 100 < config.reliability;
    
    if (isSuccessful) {
      setSuccessCount(prev => prev + 1);
      
      // Вычисляем время выполнения запроса (симуляция)
      const baseTime = 100;
      const responseTime = Math.round(baseTime * (100 / config.speed));
      
      addLog(`✅ Запрос выполнен успешно через ${config.name} (${responseTime}мс)`);
    } else {
      setFailureCount(prev => prev + 1);
      addLog(`❌ Ошибка запроса через ${config.name}`);
      
      if (currentState === serviceStates.PRIMARY) {
        // Снижаем здоровье основного сервиса
        const newHealth = Math.max(0, primaryHealth - 20);
        setPrimaryHealth(newHealth);
        
        if (newHealth < 40 && newHealth >= 20) {
          setCurrentState(serviceStates.DEGRADED);
          addLog(`⚠️ Переход в деградированный режим: ${fallbackOptions[serviceType].degraded.name}`);
        } else if (newHealth < 20) {
          setCurrentState(serviceStates.FALLBACK);
          setFallbackCount(prev => prev + 1);
          addLog(`🔄 Переход на запасной сервис: ${fallbackOptions[serviceType].fallback.name}`);
        }
      }
    }
  };

  // Восстановить основной сервис
  const recoverPrimaryService = () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setRecoveryProgress(0);
    addLog(`🔄 Запуск восстановления основного сервиса...`);
    
    const recoveryInterval = setInterval(() => {
      setRecoveryProgress(prev => {
        const newProgress = prev + 10;
        
        if (newProgress >= 100) {
          clearInterval(recoveryInterval);
          setPrimaryHealth(100);
          setCurrentState(serviceStates.PRIMARY);
          setIsRecovering(false);
          addLog(`✅ Основной сервис восстановлен`);
          return 100;
        }
        
        return newProgress;
      });
    }, 500);
  };

  // Принудительный переход в запасной режим
  const forceFallback = () => {
    if (currentState !== serviceStates.FALLBACK) {
      setPrimaryHealth(0);
      setCurrentState(serviceStates.FALLBACK);
      setFallbackCount(prev => prev + 1);
      addLog(`🔄 Принудительный переход на запасной сервис: ${fallbackOptions[serviceType].fallback.name}`);
    }
  };

  // Принудительный переход в деградированный режим
  const forceDegraded = () => {
    if (currentState !== serviceStates.DEGRADED) {
      setPrimaryHealth(30);
      setCurrentState(serviceStates.DEGRADED);
      addLog(`⚠️ Принудительный переход в деградированный режим: ${fallbackOptions[serviceType].degraded.name}`);
    }
  };

  // Сбросить симуляцию
  const resetSimulation = () => {
    setCurrentState(serviceStates.PRIMARY);
    setPrimaryHealth(100);
    setRequestCount(0);
    setSuccessCount(0);
    setFailureCount(0);
    setFallbackCount(0);
    setIsRecovering(false);
    setRecoveryProgress(0);
    setAutoFailureEnabled(false);
    setLogs([]);
    addLog('🔄 Симуляция сброшена');
  };

  // Эффект автоматического повреждения сервиса
  useEffect(() => {
    let damageInterval;
    
    if (autoFailureEnabled && currentState === serviceStates.PRIMARY && primaryHealth > 0) {
      damageInterval = setInterval(() => {
        setPrimaryHealth(prev => {
          const damage = Math.floor(Math.random() * 10) + 5;
          const newHealth = Math.max(0, prev - damage);
          
          if (prev > 30 && newHealth <= 30) {
            setCurrentState(serviceStates.DEGRADED);
            addLog(`⚠️ Автоматический переход в деградированный режим: ${fallbackOptions[serviceType].degraded.name}`);
          } else if (prev > 10 && newHealth <= 10) {
            setCurrentState(serviceStates.FALLBACK);
            setFallbackCount(prev => prev + 1);
            addLog(`🔄 Автоматический переход на запасной сервис: ${fallbackOptions[serviceType].fallback.name}`);
          }
          
          return newHealth;
        });
      }, 3000);
    }
    
    return () => clearInterval(damageInterval);
  }, [autoFailureEnabled, currentState, primaryHealth, serviceType, fallbackOptions]);

  // Получить цвет для текущего состояния
  const getStateColor = () => {
    switch(currentState) {
      case serviceStates.PRIMARY: return 'bg-green-500';
      case serviceStates.DEGRADED: return 'bg-yellow-500';
      case serviceStates.FALLBACK: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Получить класс для карточки состояния
  const getStateCardClass = (state) => {
    switch(state) {
      case serviceStates.PRIMARY:
        return currentState === state ? 'ring-4 ring-green-500 bg-green-100' : 'bg-gray-100';
      case serviceStates.DEGRADED:
        return currentState === state ? 'ring-4 ring-yellow-500 bg-yellow-100' : 'bg-gray-100';
      case serviceStates.FALLBACK:
        return currentState === state ? 'ring-4 ring-blue-500 bg-blue-100' : 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Симуляция паттерна Fallback</h1>
      
      {/* Выбор типа сервиса */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Тип сервиса:</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(serviceTypes).map(type => (
            <button
              key={type}
              className={`p-2 border rounded-lg transition ${serviceType === type ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setServiceType(type);
                addLog(`🔧 Тип сервиса изменен на ${type}`);
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Визуализация состояния */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${getStateCardClass(serviceStates.PRIMARY)}`}>
            <h3 className="font-semibold">{serviceStates.PRIMARY}</h3>
            <p className="text-sm mt-1">{fallbackOptions[serviceType].primary.name}</p>
            <p className="text-xs mt-1">Скорость: 100%, Надежность: {fallbackOptions[serviceType].primary.reliability}%</p>
          </div>
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${getStateCardClass(serviceStates.DEGRADED)}`}>
            <h3 className="font-semibold">{serviceStates.DEGRADED}</h3>
            <p className="text-sm mt-1">{fallbackOptions[serviceType].degraded.name}</p>
            <p className="text-xs mt-1">Скорость: {fallbackOptions[serviceType].degraded.speed}%, Надежность: {fallbackOptions[serviceType].degraded.reliability}%</p>
          </div>
          <div className={`p-4 rounded-lg shadow w-1/3 mx-2 text-center ${getStateCardClass(serviceStates.FALLBACK)}`}>
            <h3 className="font-semibold">{serviceStates.FALLBACK}</h3>
            <p className="text-sm mt-1">{fallbackOptions[serviceType].fallback.name}</p>
            <p className="text-xs mt-1">Скорость: {fallbackOptions[serviceType].fallback.speed}%, Надежность: {fallbackOptions[serviceType].fallback.reliability}%</p>
          </div>
        </div>
        
        {/* Индикатор здоровья */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Здоровье основного сервиса:</span>
            <span>{primaryHealth}%</span>
          </div>
          <div className="bg-gray-200 h-4 rounded-full">
            <div 
              className={`h-4 rounded-full transition-all ${
                primaryHealth > 60 ? 'bg-green-500' : 
                primaryHealth > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`} 
              style={{ width: `${primaryHealth}%` }}
            ></div>
          </div>
        </div>
        
        {/* Индикатор восстановления */}
        {isRecovering && (
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Прогресс восстановления:</span>
              <span>{recoveryProgress}%</span>
            </div>
            <div className="bg-gray-200 h-3 rounded-full">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all" 
                style={{ width: `${recoveryProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Кнопки управления */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button 
          onClick={executeRequest} 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Выполнить запрос
        </button>
        <button 
          onClick={forceDegraded} 
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          disabled={currentState === serviceStates.DEGRADED}
        >
          Перейти в деградированный режим
        </button>
        <button 
          onClick={forceFallback} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          disabled={currentState === serviceStates.FALLBACK}
        >
          Перейти на запасной сервис
        </button>
        <button 
          onClick={recoverPrimaryService} 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
          disabled={currentState === serviceStates.PRIMARY || isRecovering}
        >
          Восстановить основной сервис
        </button>
        <button 
          onClick={resetSimulation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          Сбросить
        </button>
      </div>
      
      <div className="mb-4 flex items-center">
        <input 
          type="checkbox" 
          id="autoFailure" 
          checked={autoFailureEnabled} 
          onChange={() => setAutoFailureEnabled(!autoFailureEnabled)} 
          className="mr-2"
        />
        <label htmlFor="autoFailure" className="text-sm">
          Включить автоматическую деградацию сервиса
        </label>
      </div>
      
      {/* Статистика и логи */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Статистика:</h3>
          <p>Текущее состояние: <span className="font-medium">{currentState}</span></p>
          <p>Всего запросов: <span className="font-medium">{requestCount}</span></p>
          <p>Успешных запросов: <span className="font-medium text-green-600">{successCount}</span></p>
          <p>Неудачных запросов: <span className="font-medium text-red-600">{failureCount}</span></p>
          <p>Переключений на запасной сервис: <span className="font-medium text-blue-600">{fallbackCount}</span></p>
          <p>Успешность: <span className="font-medium">{requestCount > 0 ? Math.round((successCount / requestCount) * 100) : 0}%</span></p>
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
      
      {/* Описание паттерна Fallback */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Как работает паттерн Fallback:</h3>
        <p><strong>Fallback</strong> - это стратегия восстановления, которая переключает выполнение запросов с основного сервиса на альтернативный при сбоях.</p>
        <p className="mt-2"><strong>Три состояния системы:</strong></p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li><strong>Основной</strong> режим (Normal) - система работает в штатном режиме с полной функциональностью</li>
          <li><strong>Деградированный</strong> режим (Degraded) - система работает с ограниченной функциональностью или производительностью</li>
          <li><strong>Запасной</strong> режим (Fallback) - система переключается на альтернативные сервисы или способы обработки</li>
        </ul>
        <p className="mt-2"><strong>Преимущества:</strong> повышение надежности и доступности системы, обеспечение непрерывности работы, предотвращение каскадных сбоев.</p>
      </div>
    </div>
  );
};

export default FallbackVisualizer;