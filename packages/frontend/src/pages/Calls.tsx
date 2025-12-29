import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Phone, Clock, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import Softphone from '@/components/Softphone';
import api from '@/services/api';
import './Calls.css';

interface CallRecord {
    id: string;
    direction: 'inbound' | 'outbound';
    from_number: string;
    to_number: string;
    status: string;
    duration: number;
    start_time: string;
    cost?: number;
}

interface CallStats {
    total: number;
    inbound: number;
    outbound: number;
    totalMinutes: number;
}

const Calls: React.FC = () => {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [stats, setStats] = useState<CallStats>({ total: 0, inbound: 0, outbound: 0, totalMinutes: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [showSoftphone, setShowSoftphone] = useState(false);

    useEffect(() => {
        loadCallHistory();
    }, []);

    const loadCallHistory = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/calls/history?limit=50');
            const callData = response.data.calls || [];
            setCalls(callData);

            // Calculate stats
            const inbound = callData.filter((c: CallRecord) => c.direction === 'inbound').length;
            const outbound = callData.filter((c: CallRecord) => c.direction === 'outbound').length;
            const totalMinutes = callData.reduce((acc: number, c: CallRecord) => acc + (c.duration || 0), 0) / 60;

            setStats({
                total: callData.length,
                inbound,
                outbound,
                totalMinutes: Math.round(totalMinutes)
            });
        } catch (err) {
            console.error('Failed to load call history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatPhoneNumber = (phone: string) => {
        if (phone.startsWith('+1') && phone.length === 12) {
            return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
        }
        return phone;
    };

    return (
        <div className="calls-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Calls</h1>
                    <p className="page-subtitle">View your call history and make new calls</p>
                </div>
            </header>

            <div className="calls-layout">
                {/* Main Content */}
                <div className="calls-main">
                    {/* Stats */}
                    <div className="calls-stats">
                        <Card className="stat-card">
                            <CardContent>
                                <div className="stat-icon total">
                                    <PhoneCall size={24} />
                                </div>
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Calls</div>
                            </CardContent>
                        </Card>
                        <Card className="stat-card">
                            <CardContent>
                                <div className="stat-icon inbound">
                                    <PhoneIncoming size={24} />
                                </div>
                                <div className="stat-value">{stats.inbound}</div>
                                <div className="stat-label">Inbound</div>
                            </CardContent>
                        </Card>
                        <Card className="stat-card">
                            <CardContent>
                                <div className="stat-icon outbound">
                                    <PhoneOutgoing size={24} />
                                </div>
                                <div className="stat-value">{stats.outbound}</div>
                                <div className="stat-label">Outbound</div>
                            </CardContent>
                        </Card>
                        <Card className="stat-card">
                            <CardContent>
                                <div className="stat-icon duration">
                                    <Clock size={24} />
                                </div>
                                <div className="stat-value">{stats.totalMinutes}</div>
                                <div className="stat-label">Minutes</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Call History */}
                    <Card className="history-card">
                        <CardHeader>
                            <CardTitle>
                                <Calendar size={20} />
                                Call History
                            </CardTitle>
                            <CardDescription>Your recent calls</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="loading-state">Loading call history...</div>
                            ) : calls.length === 0 ? (
                                <div className="empty-state">
                                    <PhoneCall size={48} className="empty-icon" />
                                    <p>No calls yet</p>
                                    <span>Make your first call to see history here</span>
                                </div>
                            ) : (
                                <div className="calls-list">
                                    {calls.map((call) => (
                                        <div key={call.id} className="call-row">
                                            <div className={`call-direction ${call.direction}`}>
                                                {call.direction === 'inbound' ? (
                                                    <PhoneIncoming size={18} />
                                                ) : (
                                                    <PhoneOutgoing size={18} />
                                                )}
                                            </div>
                                            <div className="call-info">
                                                <div className="call-number">
                                                    {formatPhoneNumber(call.direction === 'outbound' ? call.to_number : call.from_number)}
                                                </div>
                                                <div className="call-meta">
                                                    <span className={`call-status ${call.status}`}>
                                                        {call.status}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(call.start_time)}</span>
                                                </div>
                                            </div>
                                            <div className="call-duration">
                                                {formatDuration(call.duration)}
                                            </div>
                                            {call.cost !== undefined && (
                                                <div className="call-cost">
                                                    ${call.cost.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Softphone Sidebar */}
                <div className="calls-sidebar">
                    <Softphone />
                </div>
            </div>

            {/* Mobile Softphone Toggle */}
            <button
                className="mobile-softphone-toggle"
                onClick={() => setShowSoftphone(!showSoftphone)}
            >
                <Phone size={24} />
            </button>

            {/* Mobile Softphone Modal */}
            {showSoftphone && (
                <div className="mobile-softphone-overlay" onClick={() => setShowSoftphone(false)}>
                    <div className="mobile-softphone-container" onClick={(e) => e.stopPropagation()}>
                        <Softphone />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calls;
