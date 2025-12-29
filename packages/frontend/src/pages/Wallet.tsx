import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, History, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Modal, useToast } from '@/components/ui';
import api from '@/services/api';
import './Wallet.css';

interface Wallet {
    id: string;
    balance: number;
    currency: string;
}

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    referenceType?: string;
    createdAt: string;
}

const TOPUP_AMOUNTS = [10, 25, 50, 100];

const Wallet: React.FC = () => {
    const { success, error } = useToast();

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopupLoading, setIsTopupLoading] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState(25);
    const [customAmount, setCustomAmount] = useState('');

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        setIsLoading(true);
        try {
            const [walletRes, transactionsRes] = await Promise.all([
                api.get('/wallet'),
                api.get('/wallet/transactions?limit=10')
            ]);

            setWallet(walletRes.data);
            setTransactions(transactionsRes.data.transactions);
        } catch (err) {
            error('Failed to load wallet', 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopup = async () => {
        const amount = customAmount ? parseFloat(customAmount) : topupAmount;

        if (amount < 5) {
            error('Invalid amount', 'Minimum top-up amount is $5');
            return;
        }

        setIsTopupLoading(true);
        try {
            const response = await api.post('/wallet/topup', { amount });

            // Redirect to Stripe checkout
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Top-up failed';
            error('Top-up failed', message);
        } finally {
            setIsTopupLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check for successful payment redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            success('Payment successful!', 'Your wallet has been topped up');
            window.history.replaceState({}, '', '/wallet');
            loadWalletData();
        } else if (params.get('canceled') === 'true') {
            error('Payment canceled', 'No charges were made');
            window.history.replaceState({}, '', '/wallet');
        }
    }, []);

    if (isLoading) {
        return (
            <div className="wallet-page">
                <div className="loading-state">Loading wallet...</div>
            </div>
        );
    }

    return (
        <div className="wallet-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Wallet</h1>
                    <p className="page-subtitle">Manage your balance and payment methods</p>
                </div>
                <Button leftIcon={<Plus size={18} />} onClick={() => setShowTopupModal(true)}>
                    Add Funds
                </Button>
            </header>

            {/* Balance Card */}
            <div className="wallet-cards">
                <Card variant="glass" className="balance-card">
                    <CardContent>
                        <div className="balance-header">
                            <div className="balance-icon">
                                <CreditCard size={28} />
                            </div>
                            <div className="balance-info">
                                <span className="balance-label">Available Balance</span>
                                <span className="balance-amount">
                                    ${wallet?.balance.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        </div>
                        <div className="balance-actions">
                            <Button
                                size="sm"
                                onClick={() => setShowTopupModal(true)}
                                leftIcon={<Plus size={16} />}
                            >
                                Top Up
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rates-card">
                    <CardContent>
                        <h4 className="rates-title">Usage Summary</h4>
                        <div className="rates-list">
                            <div className="rate-item">
                                <span>Calls this month</span>
                                <span className="rate-value">0 min</span>
                            </div>
                            <div className="rate-item">
                                <span>Call costs</span>
                                <span className="rate-value">$0.00</span>
                            </div>
                            <div className="rate-item">
                                <span>Number costs</span>
                                <span className="rate-value">$0.00</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions */}
            <Card className="transactions-card">
                <CardHeader>
                    <CardTitle>
                        <History size={20} />
                        Transaction History
                    </CardTitle>
                    <CardDescription>Your recent transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <History size={48} className="empty-icon" />
                            <p>No transactions yet</p>
                            <span>Your transaction history will appear here</span>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="transaction-row">
                                    <div className={`transaction-icon ${tx.type}`}>
                                        {tx.type === 'credit' ? (
                                            <ArrowDownLeft size={18} />
                                        ) : (
                                            <ArrowUpRight size={18} />
                                        )}
                                    </div>
                                    <div className="transaction-info">
                                        <span className="transaction-desc">{tx.description}</span>
                                        <span className="transaction-date">{formatDate(tx.createdAt)}</span>
                                    </div>
                                    <div className={`transaction-amount ${tx.type}`}>
                                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top-up Modal */}
            <Modal
                isOpen={showTopupModal}
                onClose={() => setShowTopupModal(false)}
                title="Add Funds"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowTopupModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTopup}
                            isLoading={isTopupLoading}
                            rightIcon={<ExternalLink size={16} />}
                        >
                            Continue to Payment
                        </Button>
                    </>
                }
            >
                <div className="topup-content">
                    <p className="topup-label">Select amount to add</p>

                    <div className="topup-presets">
                        {TOPUP_AMOUNTS.map((amount) => (
                            <button
                                key={amount}
                                className={`topup-preset ${topupAmount === amount && !customAmount ? 'active' : ''}`}
                                onClick={() => {
                                    setTopupAmount(amount);
                                    setCustomAmount('');
                                }}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>

                    <div className="topup-custom">
                        <span className="topup-divider">or enter custom amount</span>
                        <Input
                            type="number"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            leftIcon={<span style={{ fontSize: 'var(--text-lg)' }}>$</span>}
                        />
                    </div>

                    <div className="topup-total">
                        <span>You'll pay</span>
                        <span className="topup-total-amount">
                            ${(customAmount ? parseFloat(customAmount) || 0 : topupAmount).toFixed(2)}
                        </span>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Wallet;
