import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useCallStore } from '../store/callStore';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, DollarSign, TrendingUp } from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuthStore();
    const { wallet, fetchWallet } = useWalletStore();
    const { callStats, fetchCallStats } = useCallStore();

    useEffect(() => {
        fetchWallet();
        fetchCallStats('30d');
    }, [fetchWallet, fetchCallStats]);

    const stats = [
        {
            label: 'Wallet Balance',
            value: `$${wallet?.balance?.toFixed(2) || '0.00'}`,
            icon: DollarSign,
            color: 'success'
        },
        {
            label: 'Total Calls',
            value: callStats?.totalCalls || 0,
            icon: Phone,
            color: 'primary'
        },
        {
            label: 'Inbound',
            value: callStats?.inboundCalls || 0,
            icon: PhoneIncoming,
            color: 'info'
        },
        {
            label: 'Outbound',
            value: callStats?.outboundCalls || 0,
            icon: PhoneOutgoing,
            color: 'warning'
        }
    ];

    return (
        <div className="dashboard animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    Welcome back, {user?.firstName || 'User'}!
                </h1>
                <p className="page-subtitle">
                    Here's what's happening with your VoIP account
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`stat-card stat-${color}`}>
                        <div className="stat-icon">
                            <Icon size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{value}</div>
                            <div className="stat-label">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Call Statistics</h3>
                        <span className="badge badge-info">Last 30 days</span>
                    </div>

                    <div className="quick-stats">
                        <div className="quick-stat">
                            <Clock size={20} />
                            <div>
                                <div className="quick-stat-value">
                                    {Math.floor((callStats?.totalDuration || 0) / 60)} min
                                </div>
                                <div className="quick-stat-label">Total Duration</div>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <DollarSign size={20} />
                            <div>
                                <div className="quick-stat-value">
                                    ${callStats?.totalCost?.toFixed(2) || '0.00'}
                                </div>
                                <div className="quick-stat-label">Total Cost</div>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <TrendingUp size={20} />
                            <div>
                                <div className="quick-stat-value">
                                    {callStats?.averageDuration || 0}s
                                </div>
                                <div className="quick-stat-label">Avg Duration</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                    </div>

                    <div className="quick-actions">
                        <a href="/numbers" className="quick-action">
                            <Phone size={24} />
                            <span>Buy Number</span>
                        </a>
                        <a href="/wallet" className="quick-action">
                            <DollarSign size={24} />
                            <span>Add Funds</span>
                        </a>
                        <a href="/calls" className="quick-action">
                            <Clock size={24} />
                            <span>View History</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
