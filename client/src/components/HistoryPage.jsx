import React from 'react';
import Header from './Header';
import Footer from './Footer';

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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fileName || 'Unknown File'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.xAxis || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.yAxis || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                {item.chartType ? item.chartType.replace('3d-surface', '3D Surface Plot') : 'Unknown'}
                                            </td>
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

export default HistoryPage;