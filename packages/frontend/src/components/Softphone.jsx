import { useState, useEffect, useCallback } from 'react';
import { useCallStore } from '../store/callStore';
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Pause,
    Play,
    X,
    Minimize2,
    Maximize2,
    Delete
} from 'lucide-react';
import api from '../services/api';
import './Softphone.css';

const DIALPAD_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
];

export default function Softphone() {
    const {
        callState,
        isMuted,
        isOnHold,
        dialNumber,
        setDialNumber,
        toggleMute,
        toggleHold,
        hangup,
        resetCallState
    } = useCallStore();

    const [isMinimized, setIsMinimized] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [userNumbers, setUserNumbers] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState('');
    const [error, setError] = useState(null);

    // Fetch user's DID numbers
    useEffect(() => {
        const fetchNumbers = async () => {
            try {
                const response = await api.get('/numbers');
                setUserNumbers(response.data.numbers || []);
                if (response.data.numbers?.length > 0) {
                    setSelectedNumber(response.data.numbers[0].phoneNumber);
                }
            } catch (err) {
                console.error('Failed to fetch numbers:', err);
            }
        };
        fetchNumbers();
    }, []);

    // Call duration timer
    useEffect(() => {
        let interval;
        if (callState === 'active') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [callState]);

    const handleKeyPress = useCallback((key) => {
        setDialNumber(dialNumber + key);
    }, [dialNumber, setDialNumber]);

    const handleBackspace = () => {
        setDialNumber(dialNumber.slice(0, -1));
    };

    const handleCall = async () => {
        if (!dialNumber || !selectedNumber) {
            setError('Please enter a number to call');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Note: In a real implementation, you would use the Telnyx WebRTC SDK
            // For now, we'll just trigger the API call
            await api.post('/calls', {
                from: selectedNumber,
                to: dialNumber
            });

            useCallStore.setState({ callState: 'connecting' });

            // Simulate call connection for demo
            setTimeout(() => {
                useCallStore.setState({ callState: 'active' });
                setIsConnecting(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate call');
            setIsConnecting(false);
        }
    };

    const handleHangup = () => {
        hangup();
        resetCallState();
        setIsConnecting(false);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isMinimized) {
        return (
            <div className="softphone-minimized" onClick={() => setIsMinimized(false)}>
                <Phone size={24} />
                {callState === 'active' && (
                    <span className="call-indicator active" />
                )}
            </div>
        );
    }

    return (
        <div className={`softphone ${callState !== 'idle' ? 'in-call' : ''}`}>
            {/* Header */}
            <div className="softphone-header">
                <h3>Softphone</h3>
                <div className="softphone-actions">
                    <button
                        className="btn-icon-sm"
                        onClick={() => setIsMinimized(true)}
                    >
                        <Minimize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Display */}
            <div className="softphone-display">
                {callState === 'idle' ? (
                    <>
                        <input
                            type="text"
                            className="dial-input"
                            value={dialNumber}
                            onChange={(e) => setDialNumber(e.target.value)}
                            placeholder="Enter number"
                        />
                        {userNumbers.length > 0 && (
                            <select
                                className="caller-id-select"
                                value={selectedNumber}
                                onChange={(e) => setSelectedNumber(e.target.value)}
                            >
                                {userNumbers.map(num => (
                                    <option key={num.id} value={num.phoneNumber}>
                                        {num.phoneNumber}
                                    </option>
                                ))}
                            </select>
                        )}
                    </>
                ) : (
                    <div className="call-info">
                        <div className="call-number">{dialNumber}</div>
                        <div className="call-status">
                            {callState === 'connecting' && 'Connecting...'}
                            {callState === 'ringing' && 'Ringing...'}
                            {callState === 'active' && formatDuration(callDuration)}
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="softphone-error">
                    {error}
                    <button onClick={() => setError(null)}><X size={14} /></button>
                </div>
            )}

            {/* Dialpad */}
            {callState === 'idle' && (
                <div className="dialpad">
                    {DIALPAD_KEYS.map((row, i) => (
                        <div key={i} className="dialpad-row">
                            {row.map(key => (
                                <button
                                    key={key}
                                    className="dialpad-key"
                                    onClick={() => handleKeyPress(key)}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    ))}
                    <div className="dialpad-row">
                        <button
                            className="dialpad-key"
                            onClick={handleBackspace}
                            disabled={!dialNumber}
                        >
                            <Delete size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Call Controls */}
            {callState !== 'idle' && (
                <div className="call-controls">
                    <button
                        className={`control-btn ${isMuted ? 'active' : ''}`}
                        onClick={toggleMute}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        className={`control-btn ${isOnHold ? 'active' : ''}`}
                        onClick={toggleHold}
                    >
                        {isOnHold ? <Play size={20} /> : <Pause size={20} />}
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="softphone-footer">
                {callState === 'idle' ? (
                    <button
                        className="btn-call"
                        onClick={handleCall}
                        disabled={!dialNumber || !selectedNumber || isConnecting}
                    >
                        <Phone size={20} />
                        {isConnecting ? 'Calling...' : 'Call'}
                    </button>
                ) : (
                    <button
                        className="btn-hangup"
                        onClick={handleHangup}
                    >
                        <PhoneOff size={20} />
                        End Call
                    </button>
                )}
            </div>
        </div>
    );
}
