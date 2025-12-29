import React from 'react';
import { Phone, Globe, TrendingUp, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const user = useAuthStore((state) => state.user);

    const stats = [
        { icon: Phone, label: 'Active Numbers', value: '0', color: 'primary' },
        { icon: Globe, label: 'Countries', value: '140+', color: 'secondary' },
        { icon: TrendingUp, label: 'Minutes Used', value: '0', color: 'success' },
        { icon: CreditCard, label: 'Balance', value: '$0.00', color: 'warning' },
    ];

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        Welcome back, {user?.firstName || 'User'}!
                    </h1>
                    <p className="dashboard-subtitle">
                        Here's an overview of your account
                    </p>
                </div>
            </header>

            <div className="dashboard-stats">
                {stats.map((stat) => (
                    <Card key={stat.label} className="dashboard-stat-card" hoverable>
                        <CardContent>
                            <div className={`dashboard-stat-icon stat-${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="dashboard-stat-value">{stat.value}</div>
                            <div className="dashboard-stat-label">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="dashboard-grid">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Get started with your VoIP account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="quick-actions">
                            <a href="/numbers" className="quick-action">
                                <Phone size={20} />
                                <span>Get a Phone Number</span>
                            </a>
                            <a href="/wallet" className="quick-action">
                                <CreditCard size={20} />
                                <span>Add Funds</span>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Calls</CardTitle>
                        <CardDescription>Your recent call history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="empty-state">
                            <Phone size={48} className="empty-icon" />
                            <p>No recent calls</p>
                            <span>Your call history will appear here</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
