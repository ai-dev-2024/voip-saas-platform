import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { loadStripe } from '@stripe/stripe-js';
import {
    Wallet as WalletIcon,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    Loader,
    ExternalLink
} from 'lucide-react';
import './Wallet.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Wallet() {
    const { wallet, transactions, pagination, fetchWallet, fetchTransactions, createTopup, isLoading } = useWalletStore();
    const [topupAmount, setTopupAmount] = useState(25);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);

    useEffect(() => {
        fetchWallet();
        fetchTransactions();
    }, [fetchWallet, fetchTransactions]);

    const handleTopup = async () => {
        if (topupAmount < 5) return;

        setIsProcessing(true);
        try {
            const { url } = await createTopup(topupAmount);
            window.location.href = url; // Redirect to Stripe Checkout
        } catch (error) {
            console.error('Topup error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const presetAmounts = [10, 25, 50, 100];

    return (
        <div className="wallet-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Wallet</h1>
                <p className="page-subtitle">Manage your account balance</p>
            </div>

            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-info">
                    <div className="balance-label">Available Balance</div>
                    <div className="balance-amount">
                        ${wallet?.balance?.toFixed(2) || '0.00'}
                    </div>
                    <div className="balance-currency">{wallet?.currency || 'USD'}</div>
                </div>

                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowTopupModal(true)}
                >
                    <Plus size={20} />
                    Add Funds
                </button>
            </div>

            {/* Transaction History */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Transaction History</h3>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <Loader className="animate-spin" size={32} />
                    </div>
                ) : transactions.length > 0 ? (
                    <div className="transactions-list">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="transaction-item">
                                <div className={`transaction-icon ${tx.type}`}>
                                    {tx.type === 'credit' ? (
                                        <ArrowDownRight size={20} />
                                    ) : (
                                        <ArrowUpRight size={20} />
                                    )}
                                </div>

                                <div className="transaction-details">
                                    <div className="transaction-desc">{tx.description}</div>
                                    <div className="transaction-date">
                                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>

                                <div className={`transaction-amount ${tx.type}`}>
                                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <CreditCard size={48} />
                        <h4>No transactions yet</h4>
                        <p>Your transaction history will appear here</p>
                    </div>
                )}
            </div>

            {/* Topup Modal */}
            {showTopupModal && (
                <div className="modal-overlay" onClick={() => setShowTopupModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Funds</h3>
                            <button
                                className="btn-icon-sm"
                                onClick={() => setShowTopupModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="topup-content">
                            <div className="preset-amounts">
                                {presetAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        className={`preset-btn ${topupAmount === amount ? 'active' : ''}`}
                                        onClick={() => setTopupAmount(amount)}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Custom Amount</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-symbol">$</span>
                                    <input
                                        type="number"
                                        className="input amount-input"
                                        min={5}
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(Number(e.target.value))}
                                    />
                                </div>
                                <span className="input-hint">Minimum $5.00</span>
                            </div>

                            <button
                                className="btn btn-primary w-full"
                                onClick={handleTopup}
                                disabled={isProcessing || topupAmount < 5}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink size={18} />
                                        Pay with Stripe
                                    </>
                                )}
                            </button>

                            <p className="secure-note">
                                <CreditCard size={14} />
                                Secure payment powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
