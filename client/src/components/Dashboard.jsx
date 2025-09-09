import React, { useState, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import PlotlySurfacePlot from './PlotlySurfacePlot';
import Chart2D from './Chart2D';

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
        onAnalysis(analysisData);
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
    
    const generateColors = (count, type) => {
      const colorPalettes = {
        bar: [
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
        ],
        line: [
          'rgba(75, 192, 192, 0.6)',   // Teal
          'rgba(255, 99, 132, 0.6)',   // Red
          'rgba(54, 162, 235, 0.6)',   // Blue
          'rgba(153, 102, 255, 0.6)',  // Purple
          'rgba(255, 159, 64, 0.6)'    // Orange
        ],
        pie: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
          '#36A2EB', '#FFCE56', '#9966FF', '#FF9F40', '#C9CBCF',
          '#FF99CC', '#66FF99', '#99CCFF', '#FFCC99', '#CC99FF',
          '#99FFCC', '#CCFF99', '#FF9999', '#99CCCC', '#FFCCFF'
        ]
      };
      
      const palette = colorPalettes[type] || colorPalettes.bar;
      const colors = [];
      for (let i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
      }
      return colors;
    };
    
    const colors = generateColors(labels.length, chartType);
    const borderColors = chartType === 'pie' ? colors : colors.map(color => 
      color.replace('0.8', '1').replace('0.6', '1')
    );
    
    const newChartData = {
      labels,
      datasets: [{
          label: `${yAxis} by ${xAxis}`,
          data: chartValues,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: chartType === 'pie' ? 2 : 1,
          fill: chartType === 'line' ? true : false,
          tension: chartType === 'line' ? 0.4 : 0,
          pointBackgroundColor: chartType === 'line' ? borderColors : undefined,
          pointBorderColor: chartType === 'line' ? '#fff' : undefined,
          pointBorderWidth: chartType === 'line' ? 2 : undefined,
          pointRadius: chartType === 'line' ? 5 : undefined,
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
            window.Plotly.downloadImage(plotDiv, {format: 'png', width: 800, height: 600, filename: 'surface-plot'});
        } else {
            console.error("Could not find Plotly plot to download.");
        }
        return;
    } 
    if (!window.html2canvas) { console.error("Download library (html2canvas) not loaded."); return; }
    const exportCanvas = chartContainer.querySelector('canvas');
    if (!exportCanvas) { 
        console.error("Could not find canvas to download."); 
        return; 
    }
    window.html2canvas(exportCanvas, { useCORS: true, backgroundColor: '#ffffff' }).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'chart.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

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
                <button onClick={() => downloadChart('png')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50" disabled={!scriptsLoaded}>Download Chart</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;