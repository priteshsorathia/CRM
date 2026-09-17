"use client";
import React, { useState, useEffect } from 'react';
import MetricTile from '../components/MetricTile';
import { metricsData } from '../data/dummyData';

export default function ExecutiveMetrics() {
    const [metrics, setMetrics] = useState(metricsData);

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => prev.map(m => {
                if (['revenue', 'expenses', 'profit'].includes(m.type)) {
                    const currentVal = parseInt(m.value.replace(/[^0-9]/g, ''));
                    const newVal = currentVal + Math.floor(Math.random() * 500) - 100;
                    return { ...m, value: `$${newVal.toLocaleString()}` };
                }
                return m;
            }));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {metrics.map((metric, idx) => (
                <MetricTile key={metric.id} metric={metric} delay={idx * 0.05} />
            ))}
        </div>
    );
}
