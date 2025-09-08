import React, { useState, useRef, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

// --- Helper hook to load external scripts dynamically ---
const useExternalScripts = (urls) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let isMounted = true;
    const loadScripts = async () => {
      try {
        const promises = urls.map(url => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.body.appendChild(script);
          });
        });
        await Promise.all(promises);
        if (isMounted) setLoaded(true);
      } catch (error) {
        console.error(error);
        if (isMounted) setLoaded(false);
      }
    };
    loadScripts();
    return () => { isMounted = false; };
  }, [JSON.stringify(urls)]);
  return loaded;
};

// --- Header Component ---
const Header = ({ user, onLogout, onViewHistory, onBack }) => {
    return (
        <header className="dashboard-header shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Excel Analysis Platform</h1>
                {user && (
                    <div className="flex items-center">
                        <span className="hidden sm:inline mr-4 text-white">Welcome, {user.name}</span>
                        {onViewHistory && <button onClick={onViewHistory} className="btn-primary text-white font-bold py-2 px-4 rounded-lg mr-2 sm:mr-4">History</button>}
                        {onBack && <button onClick={onBack} className="btn-primary text-white font-bold py-2 px-4 rounded-lg mr-2 sm:mr-4">Dashboard</button>}
                        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Logout</button>
                    </div>
                )}
            </div>
        </header>
    );
};

// --- Footer Component ---
const Footer = () => {
    return (
        <footer className="dashboard-header text-white py-6 mt-auto">
            <div className="container mx-auto text-center">
                <p>&copy; 2024 Excel Analytics Platform. All Rights Reserved.</p>
                <p className="text-sm text-gray-300">Visualize Your Data with Style</p>
            </div>
        </footer>
    );
};

// --- Authentication Page Component ---
const AuthPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const url = isLogin ? '/api/login' : '/api/register';
        const payload = isLogin ? { email, password } : { name, email, password };

        try {
            const response = await fetch(`http://localhost:5000/api/auth${url.replace('/api', '')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Something went wrong');
            }

            if (isLogin) {
                onLoginSuccess(data);
            } else {
                setSuccessMessage('Registration successful! Please sign in.');
                setIsLogin(true);
                setName('');
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-grow auth-container text-gray-800 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md fade-in">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                    {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">{successMessage}</p>}
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="mb-4">
                                <label className="block text-gray-600 mb-2" htmlFor="name">Name</label>
                                <input
                                    type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-2" htmlFor="email">Email Address</label>
                            <input
                                type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-600 mb-2" htmlFor="password">Password</label>
                            <input
                                type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                            />
                        </div>
                        <button type="submit" className="w-full btn-primary text-white font-bold py-2 px-4 rounded-lg">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }} className="w-full mt-4 text-sm text-purple-600 hover:underline">
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};


// --- 3D Surface Plot Component (using Plotly.js) ---
const PlotlySurfacePlot = ({ data, xAxisLabel, yAxisLabel }) => {
    const plotRef = useRef(null);

    useEffect(() => {
        if (!data || !plotRef.current || !window.Plotly) return;

        const z_data = [data.datasets[0].data, data.datasets[0].data];
        
        const plotData = [{
           z: z_data,
           x: data.labels,
           y: [yAxisLabel, ""],
           type: 'surface',
           colorscale: [
               [0, '#440154'],    // Deep purple
               [0.1, '#482777'],  // Purple
               [0.2, '#3f4a8a'],  // Blue-purple
               [0.3, '#31678e'],  // Blue
               [0.4, '#26838f'],  // Teal
               [0.5, '#1f9d8a'],  // Green-teal
               [0.6, '#6cce5a'],  // Green
               [0.7, '#b6de2b'],  // Yellow-green
               [0.8, '#fee825'],  // Yellow
               [0.9, '#fde725']   // Bright yellow
           ],
           showscale: true,
           colorbar: {
               title: yAxisLabel,
               titlefont: { size: 14, color: '#1f2937' },
               tickfont: { size: 12, color: '#374151' }
           }
        }];

        const layout = {
            title: { 
                text: `3D Surface: ${data.datasets[0].label}`, 
                font: { 
                    color: '#1f2937', 
                    size: 18,
                    family: 'Roboto, sans-serif'
                } 
            },
            autosize: true,
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { color: '#374151', family: 'Roboto, sans-serif' },
            scene: {
                xaxis: {
                    title: { text: xAxisLabel, font: { size: 14, color: '#1f2937' } },
                    tickfont: { size: 12, color: '#374151' }
                },
                yaxis: {
                    title: { text: '', font: { size: 14, color: '#1f2937' } },
                    tickfont: { size: 12, color: '#374151' }
                },
                zaxis: {
                    title: { text: yAxisLabel, font: { size: 14, color: '#1f2937' } },
                    tickfont: { size: 12, color: '#374151' }
                },
                camera: { eye: {x: 1.87, y: 0.88, z: -0.64} },
                bgcolor: 'rgba(0,0,0,0)'
            },
            margin: { l: 0, r: 0, b: 0, t: 40 }
        };
        
        window.Plotly.newPlot(plotRef.current, plotData, layout, {responsive: true, displayModeBar: false});

        return () => {
            if (plotRef.current) {
                window.Plotly.purge(plotRef.current);
            }
        };
    }, [data, xAxisLabel, yAxisLabel]);

    return <div ref={plotRef} className="w-full h-96" />;
};

// --- History Page Component ---
const HistoryPage = ({ user, onLogout, history, onBack }) => {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col">
            <Header user={user} onLogout={onLogout} onBack={onBack} />
            <main className="flex-grow container mx-auto px-6 py-8">
                <div className="bg-white p-6 rounded-lg shadow-lg fade-in">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Analysis History</h1>
                    {history.length === 0 ? (
                        <p className="text-center text-gray-500">No analysis history found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">File Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">X-Axis</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Y-Axis</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chart Type</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {history.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fileName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.xAxis}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.yAxis}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.chartType.replace('3d-surface', '3D Surface Plot')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};


// --- Dashboard Component ---
const Dashboard = ({ user, token, onLogout, scriptsLoaded, onAnalysis, onViewHistory }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const chartContainerRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    } else {
      setError('Please select a valid Excel file (.xls or .xlsx)');
      setFile(null);
      setData([]);
      setHeaders([]);
      setChartData(null);
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!window.XLSX) { console.error("XLSX library not loaded."); return; }
      const binaryStr = e.target.result;
      const workbook = window.XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData && jsonData.length > 0) {
        const fileHeaders = jsonData[0];
        const fileData = jsonData.slice(1).map(row => {
          let rowData = {};
          fileHeaders.forEach((header, index) => { rowData[header] = row[index]; });
          return rowData;
        });
        setHeaders(fileHeaders);
        setData(fileData);
        setXAxis(fileHeaders[0]);
        setYAxis(fileHeaders[1] || fileHeaders[0]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleGenerateChart = async () => {
      if (!file || !xAxis || !yAxis) return;
      const analysisData = {
        fileName: file.name,
        date: new Date().toLocaleString(),
        xAxis,
        yAxis,
        chartType,
      };
      
      try {
        await fetch('http://localhost:5000/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(analysisData)
        });
        onAnalysis(analysisData); // Update local state for immediate feedback
        generateChartData();
      } catch (err) {
          console.error('Failed to save history', err);
      }
  }

  const generateChartData = () => {
    const labels = [...new Set(data.map(item => item[xAxis]))];
    const yAxisData = data.reduce((acc, item) => {
        const xValue = item[xAxis];
        const yValue = parseFloat(item[yAxis]);
        if (!isNaN(yValue)) { acc[xValue] = (acc[xValue] || 0) + yValue; }
        return acc;
    }, {});
    const chartValues = labels.map(label => yAxisData[label] || 0);
    
    // Generate vibrant colors based on chart type
    let backgroundColors, borderColors;
    
    if (chartType === 'bar') {
      // Vibrant colors for bar charts
      const barColors = [
        'rgba(255, 99, 132, 0.8)',   // Red
        'rgba(54, 162, 235, 0.8)',   // Blue
        'rgba(255, 205, 86, 0.8)',   // Yellow
        'rgba(75, 192, 192, 0.8)',   // Teal
        'rgba(153, 102, 255, 0.8)',  // Purple
        'rgba(255, 159, 64, 0.8)',   // Orange
        'rgba(199, 199, 199, 0.8)',  // Grey
        'rgba(83, 102, 255, 0.8)',   // Indigo
        'rgba(255, 99, 255, 0.8)',   // Pink
        'rgba(99, 255, 132, 0.8)',   // Green
        'rgba(255, 206, 84, 0.8)',   // Amber
        'rgba(54, 235, 162, 0.8)'    // Mint
      ];
      const barBorderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)',
        'rgba(99, 255, 132, 1)',
        'rgba(255, 206, 84, 1)',
        'rgba(54, 235, 162, 1)'
      ];
      backgroundColors = labels.map((_, index) => barColors[index % barColors.length]);
      borderColors = labels.map((_, index) => barBorderColors[index % barBorderColors.length]);
    } else if (chartType === 'line') {
      // Gradient colors for line charts
      backgroundColors = 'rgba(34, 197, 94, 0.2)';  // Green gradient
      borderColors = 'rgba(34, 197, 94, 1)';
    } else if (chartType === 'pie') {
      // Vibrant pie colors
      const pieColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
        '#36A2EB', '#FFCE56', '#FF9F40', '#9966FF', '#4BC0C0',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];
      backgroundColors = labels.map((_, index) => pieColors[index % pieColors.length]);
      borderColors = labels.map((_, index) => pieColors[index % pieColors.length]);
    } else {
      // Default colors for 3D surface
      backgroundColors = 'rgba(139, 92, 246, 0.7)';
      borderColors = 'rgba(139, 92, 246, 1)';
    }
    
    const newChartData = {
      labels,
      datasets: [{
          label: `${yAxis} by ${xAxis}`,
          data: chartValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          tension: chartType === 'line' ? 0.4 : 0,
          fill: chartType === 'line' ? true : false,
          pointBackgroundColor: chartType === 'line' ? 'rgba(34, 197, 94, 1)' : undefined,
          pointBorderColor: chartType === 'line' ? '#fff' : undefined,
          pointHoverBackgroundColor: chartType === 'line' ? '#fff' : undefined,
          pointHoverBorderColor: chartType === 'line' ? 'rgba(34, 197, 94, 1)' : undefined,
      }],
    };
    setChartData(newChartData);
  };
  

  const downloadChart = (format) => {
    const is3D = chartType === '3d-surface';
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) {
        console.error("Chart container ref not found.");
        return;
    }
    
    if (is3D) {
        if (!window.Plotly) { console.error("Plotly library not loaded."); return; }
        const plotDiv = chartContainer.querySelector('.js-plotly-plot');
        if (plotDiv) {
            if (format === 'png') {
                window.Plotly.downloadImage(plotDiv, {
                    format: 'png', 
                    width: 1200, 
                    height: 800, 
                    filename: `3d-surface-${new Date().getTime()}`
                });
            } else if (format === 'pdf') {
                window.Plotly.downloadImage(plotDiv, {
                    format: 'pdf', 
                    width: 1200, 
                    height: 800, 
                    filename: `3d-surface-${new Date().getTime()}`
                });
            }
        } else {
            console.error("Could not find Plotly plot to download.");
        }
        return;
    }
    
    // For 2D charts (bar, line, pie)
    const exportCanvas = chartContainer.querySelector('canvas');
    if (!exportCanvas) { 
        console.error("Could not find canvas to download."); 
        return; 
    }
    
    if (format === 'png') {
        if (!window.html2canvas) { 
            console.error("html2canvas library not loaded."); 
            return; 
        }
        window.html2canvas(exportCanvas, { 
            useCORS: true, 
            backgroundColor: '#ffffff',
            scale: 2
        }).then((canvas) => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `${chartType}-chart-${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    } else if (format === 'pdf') {
        if (!window.html2canvas || !window.jsPDF) { 
            console.error("Required libraries not loaded for PDF export."); 
            return; 
        }
        window.html2canvas(exportCanvas, { 
            useCORS: true, 
            backgroundColor: '#ffffff',
            scale: 2
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jsPDF.jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Calculate dimensions to fit the page
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = (pdfHeight - imgHeight * ratio) / 2;
            
            // Add title
            pdf.setFontSize(16);
            pdf.text(`${chartType.toUpperCase()} Chart - ${yAxis} by ${xAxis}`, 20, 20);
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
            
            // Add chart image
            pdf.addImage(imgData, 'PNG', imgX, imgY + 20, imgWidth * ratio, imgHeight * ratio);
            
            // Save PDF
            pdf.save(`${chartType}-chart-${new Date().getTime()}.pdf`);
        });
    }
  };

  const Chart2D = ({type, data}) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        if (chartRef.current && window.Chart) {
            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new window.Chart(ctx, {
                type: type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 2,
                            cornerRadius: 10,
                            displayColors: true,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            }
                        }
                    },
                    scales: type !== 'pie' ? {
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                color: '#374151'
                            },
                            title: {
                                display: true,
                                text: xAxis,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#1f2937'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                color: '#374151'
                            },
                            title: {
                                display: true,
                                text: yAxis,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#1f2937'
                                }
                            }
                        }
                    } : {}
                }
            });
        }
        return () => {
            if(chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        }
    }, [data, type]);

    return <canvas ref={chartRef}></canvas>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Header user={user} onLogout={onLogout} onViewHistory={onViewHistory} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg card fade-in">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Controls</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
            <div className="mb-6">
              <label htmlFor="file-upload" className={`block text-sm font-medium mb-2 ${!scriptsLoaded ? 'text-gray-400' : 'text-gray-700'}`}>Upload Excel File {!scriptsLoaded && '(Loading...)'}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-2 ${!scriptsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}><span>Upload a file</span><input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" disabled={!scriptsLoaded} /></label>
                          <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">XLS, XLSX up to 10MB</p>
                  </div>
              </div>
              {file && <p className="text-sm text-gray-500 mt-2">Selected: {file.name}</p>}
            </div>
            {headers.length > 0 && (
              <>
                <div className="mb-4">
                  <label htmlFor="x-axis" className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
                  <select id="x-axis" value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">{headers.map(h => <option key={h} value={h}>{h}</option>)}</select>
                </div>
                <div className="mb-4">
                  <label htmlFor="y-axis" className="block text-sm font-medium text-gray-700 mb-1">Y-Axis</label>
                  <select id="y-axis" value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">{headers.map(h => <option key={h} value={h}>{h}</option>)}</select>
                </div>
                <div className="mb-6">
                  <label htmlFor="chart-type" className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                  <select id="chart-type" value={chartType} onChange={(e) => setChartType(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="bar">Bar Chart</option><option value="line">Line Chart</option><option value="pie">Pie Chart</option><option value="3d-surface">3D Surface Plot</option>
                  </select>
                </div>
                <button onClick={handleGenerateChart} className="w-full btn-primary text-white font-bold py-2 px-4 rounded-lg">Generate Chart</button>
              </>
            )}
          </div>
          <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-lg card fade-in">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Visualization</h2>
            <div className="p-4 rounded-lg" ref={chartContainerRef}>
              {chartData ? (
                <div className="h-96">
                  {chartType === '3d-surface' ? (
                    <PlotlySurfacePlot data={chartData} xAxisLabel={xAxis} yAxisLabel={yAxis} />
                  ) : (
                    <Chart2D type={chartType} data={chartData} />
                  )}
                </div>
              ) : (<div className="text-center text-gray-500 py-20"><p>{scriptsLoaded ? 'Please upload a file and select axes to generate a chart.' : 'Loading analysis tools...'}</p></div>)}
            </div>
            {chartData && (
              <div className="mt-4 flex justify-end space-x-4">
                <button 
                  onClick={() => downloadChart('png')} 
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 flex items-center space-x-2" 
                  disabled={!scriptsLoaded}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>PNG</span>
                </button>
                <button 
                  onClick={() => downloadChart('pdf')} 
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 flex items-center space-x-2" 
                  disabled={!scriptsLoaded}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// --- Main App Component ---
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
                setAnalysisHistory(data);
              } catch (error) {
                  console.error(error);
              }
          }
      };
      if (currentPage === 'history') {
          fetchHistory();
      }
  }, [currentPage, token]);

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