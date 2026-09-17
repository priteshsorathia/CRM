"use client";
import React from 'react';
import OperationsOverview from './OperationsOverview';
import QuickActionsPanel from './QuickActionsPanel';
import ActivityTimeline from './ActivityTimeline';

export default function AnalyticsGrid() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-1">
                <OperationsOverview />
            </div>
            <div className="lg:col-span-1">
                <QuickActionsPanel />
            </div>
            <div className="lg:col-span-1">
                <ActivityTimeline />
            </div>
        </div>
    );
}
