import React, { useRef, useEffect } from 'react';

const PlotlySurfacePlot = ({ data, xAxisLabel, yAxisLabel }) => {
    const plotRef = useRef(null);

    useEffect(() => {
        if (!data || !plotRef.current || !window.Plotly) return;

        // Create enhanced 3D surface data with varied heights
        const baseData = data.datasets[0].data;
        const z_data = [
            baseData,
            baseData.map(val => val * 1.2),
            baseData.map(val => val * 0.8)
        ];
        
        const plotData = [{
           z: z_data,
           x: data.labels,
           y: [0, 1, 2],
           type: 'surface',
           colorscale: 'Viridis',
           showscale: true,
           colorbar: {
               title: yAxisLabel,
               titleside: 'right'
           }
        }];

        const layout = {
            title: { 
                text: data.datasets[0].label, 
                font: { color: '#4b5563', size: 16 }
            },
            autosize: true,
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { color: '#4b5563' },
            scene: {
                xaxis: { title: xAxisLabel },
                yaxis: { title: 'Surface Depth' },
                zaxis: { title: yAxisLabel },
                camera: { eye: { x: 1.87, y: 0.88, z: -0.64 } }
            },
            margin: { l: 0, r: 0, b: 0, t: 40 }
        };
        
        window.Plotly.newPlot(plotRef.current, plotData, layout, { responsive: true, displayModeBar: false });

        return () => {
            if (plotRef.current) {
                window.Plotly.purge(plotRef.current);
            }
        };
    }, [data, xAxisLabel, yAxisLabel]);

    return <div ref={plotRef} className="w-full h-96" />;
};

export default PlotlySurfacePlot;