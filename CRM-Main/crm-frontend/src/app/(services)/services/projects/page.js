"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectTable from './ProjectTable';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/utils/apiBase';
import RestaurantLoader from '@/components/RestaurantLoader';
import PermissionWrapper from '@/components/PermissionWrapper';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ client: 'All', from: '', to: '', status: 'total' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProjects(data.projects);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const statusMap = {
                active: 'Active',
                completed: 'Completed',
                onHold: 'On Hold',
                overdue: 'Overdue'
            };
            const targetStatus = statusMap[filters.status];
            const matchesStatus = (!filters.status || filters.status === 'total') || p.status === targetStatus;
            
            const matchesClient = filters.client === 'All' || p.client === filters.client;
            
            let matchesDate = true;
            if (filters.from && p.start) {
                matchesDate = matchesDate && new Date(p.start) >= new Date(filters.from);
            }
            if (filters.to && p.start) {
                matchesDate = matchesDate && new Date(p.start) <= new Date(filters.to);
            }

            return matchesStatus && matchesClient && matchesDate;
        });
    }, [projects, filters]);

    const handleEdit = (project) => {
        router.push(`/services/projects/edit/${project.id}`);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProjects(prev => prev.filter(p => p.id !== id));
            } else {
                alert(data.message || 'Error deleting project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RestaurantLoader variant="container" message="Loading projects..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4 bg-white/50 p-1 sm:p-0 rounded-2xl mb-4 sm:mb-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">Projects & Deliverables</h1>
                    <p className="hidden md:block text-sm text-gray-500 mt-1">Track strategic project milestones, tasks and team pace.</p>
                </div>
                <PermissionWrapper module="PROJECT" action="CREATE">
                    <button
                        onClick={() => router.push('/services/projects/new')}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap shrink-0"
                    >
                        <Plus size={16} className="sm:w-[18px]" /> 
                        <span>New Project</span>
                    </button>
                </PermissionWrapper>
            </div>


            {/* Direct Overview Content */}
            <div className="space-y-6">
                <ProjectOverview 
                    projects={projects} 
                    activeFilter={filters.status}
                    onFilterChange={(s) => setFilters({ ...filters, status: s })}
                />
                
                <div className="flex flex-col gap-4">
                    <ProjectTable 
                        projects={filteredProjects} 
                        allProjects={projects}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                </div>
            </div>
        </div>
    );
}
