import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import useExternalScripts from './hooks/useExternalScripts';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState('auth');

  const scriptsLoaded = useExternalScripts([
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.plot.ly/plotly-2.33.0.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  ]);

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setToken(data.token);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setCurrentPage('auth');
  };
  
  const handleAnalysis = (analysisData) => {
      setAnalysisHistory(prev => [...prev, analysisData]);
  };

  useEffect(() => {
      const fetchHistory = async () => {
          if (token) {
              try {
                const response = await fetch('http://localhost:5000/api/history', {
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch history');
                }
                const data = await response.json();
                setAnalysisHistory(data.data || data || []);
              } catch (error) {
                  console.error(error);
                  setAnalysisHistory([]);
              }
          }
      };
      if (currentPage === 'history') {
          fetchHistory();
      }
  }, [currentPage, token]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': token }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Invalid token');
      })
      .then(data => {
        setUser(data.user);
        setToken(token);
        setCurrentPage('dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentPage('auth');
      });
    }
  }, []);

  const renderPage = () => {
      switch(currentPage) {
          case 'dashboard':
              return <Dashboard user={user} token={token} onLogout={handleLogout} scriptsLoaded={scriptsLoaded} onAnalysis={handleAnalysis} onViewHistory={() => setCurrentPage('history')} />;
          case 'history':
              return <HistoryPage user={user} onLogout={handleLogout} history={analysisHistory} onBack={() => setCurrentPage('dashboard')} />;
          case 'auth':
          default:
              return <AuthPage onLoginSuccess={handleLoginSuccess} />;
      }
  };

  return <>{renderPage()}</>;
};

export default App;