import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom';
import './App.css';
import ResiliencePatternsApp from './components/ResiliencePatternsApp';

function App() {
  // Создаем роутер с маршрутами для каждого паттерна
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Navigate to="/timeout" replace />
    },
    {
      path: '/:pattern',
      element: <ResiliencePatternsApp />
    }
  ], {
    basename: process.env.PUBLIC_URL
  });

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;