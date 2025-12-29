import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Phone,
    Wallet,
    PhoneCall,
    Settings,
    LogOut,
    User,
    Menu,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import './Layout.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/numbers', icon: Phone, label: 'Numbers' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/calls', icon: PhoneCall, label: 'Calls' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Phone className="sidebar-logo-icon" size={28} />
                        <span className="sidebar-logo-text">VoIP</span>
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.firstName} />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="sidebar-user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="main">
                {/* Mobile header */}
                <header className="mobile-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo">
                        <Phone size={24} />
                        <span>VoIP</span>
                    </div>
                </header>

                {/* Page content */}
                <div className="main-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
