import React, { useRef, useEffect } from 'react';

const Chart2D = ({ type, data }) => {
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
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: '#374151',
                                padding: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true
                        }
                    },
                    scales: type !== 'pie' ? {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Categories',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Values',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    } : {}
                }
            });
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        }
    }, [data, type]);

    return <canvas ref={chartRef}></canvas>;
};

export default Chart2D;