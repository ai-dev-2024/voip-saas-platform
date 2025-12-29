import { useState, useEffect } from 'react';
import { useCallStore } from '../store/callStore';
import {
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Phone,
    Clock,
    Filter,
    Loader
} from 'lucide-react';
import './Calls.css';

export default function Calls() {
    const { callHistory, pagination, callStats, fetchCallHistory, fetchCallStats, isLoading } = useCallStore();

    const [filters, setFilters] = useState({
        direction: '',
        status: ''
    });

    useEffect(() => {
        fetchCallHistory(filters);
        fetchCallStats('30d');
    }, [fetchCallHistory, fetchCallStats]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchCallHistory(newFilters);
    };

    const getCallIcon = (direction, status) => {
        if (status === 'missed') {
            return <PhoneMissed size={18} className="text-danger" />;
        }
        return direction === 'inbound'
            ? <PhoneIncoming size={18} className="text-success" />
            : <PhoneOutgoing size={18} className="text-info" />;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="calls-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Call History</h1>
                <p className="page-subtitle">View your call detail records</p>
            </div>

            {/* Stats */}
            {callStats && (
                <div className="call-stats-row">
                    <div className="call-stat">
                        <Phone size={20} />
                        <div>
                            <span className="stat-value">{callStats.totalCalls}</span>
                            <span className="stat-label">Total Calls</span>
                        </div>
                    </div>
                    <div className="call-stat">
                        <PhoneIncoming size={20} />
                        <div>
                            <span className="stat-value">{callStats.inboundCalls}</span>
                            <span className="stat-label">Inbound</span>
                        </div>
                    </div>
                    <div className="call-stat">
                        <PhoneOutgoing size={20} />
                        <div>
                            <span className="stat-value">{callStats.outboundCalls}</span>
                            <span className="stat-label">Outbound</span>
                        </div>
                    </div>
                    <div className="call-stat">
                        <Clock size={20} />
                        <div>
                            <span className="stat-value">{Math.floor((callStats.totalDuration || 0) / 60)}m</span>
                            <span className="stat-label">Duration</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card">
                <div className="filters-bar">
                    <Filter size={18} />
                    <select
                        className="filter-select"
                        value={filters.direction}
                        onChange={(e) => handleFilterChange('direction', e.target.value)}
                    >
                        <option value="">All Directions</option>
                        <option value="inbound">Inbound</option>
                        <option value="outbound">Outbound</option>
                    </select>
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="missed">Missed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <Loader className="animate-spin" size={32} />
                    </div>
                ) : callHistory.length > 0 ? (
                    <table className="table cdr-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Cost</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {callHistory.map((call) => (
                                <tr key={call.id}>
                                    <td>
                                        <div className="call-type">
                                            {getCallIcon(call.direction, call.status)}
                                            <span className="capitalize">{call.direction}</span>
                                        </div>
                                    </td>
                                    <td className="font-mono">{call.fromNumber || '-'}</td>
                                    <td className="font-mono">{call.toNumber || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${call.status === 'completed' ? 'success' :
                                                call.status === 'missed' ? 'warning' : 'danger'
                                            }`}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td>{formatDuration(call.durationSeconds)}</td>
                                    <td>${call.cost?.toFixed(4) || '0.0000'}</td>
                                    <td className="text-muted">
                                        {new Date(call.startTime).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <Phone size={48} />
                        <h4>No calls yet</h4>
                        <p>Your call history will appear here</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={pagination.page <= 1}
                            onClick={() => fetchCallHistory({ ...filters, page: pagination.page - 1 })}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchCallHistory({ ...filters, page: pagination.page + 1 })}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
