import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Phone,
    Wallet,
    History,
    Settings,
    LogOut,
    PhoneCall
} from 'lucide-react';
import Softphone from './Softphone';
import './Layout.css';

export default function Layout() {
    const { user, logout } = useAuthStore();
    const { wallet, fetchWallet } = useWalletStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/numbers', icon: Phone, label: 'Numbers' },
        { to: '/wallet', icon: Wallet, label: 'Wallet' },
        { to: '/calls', icon: History, label: 'Call History' },
        { to: '/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <PhoneCall className="logo-icon" />
                        <span className="logo-text">VoIP SaaS</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="user-details">
                            <div className="user-name">
                                {user?.firstName || 'User'}
                            </div>
                            <div className="user-balance">
                                ${wallet?.balance?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Softphone Widget */}
            <Softphone />
        </div>
    );
}
