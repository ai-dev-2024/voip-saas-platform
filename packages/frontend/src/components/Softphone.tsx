import React, { useEffect, useState } from 'react';
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Pause,
    Play,
    Hash,
    Delete,
    User,
    ChevronDown
} from 'lucide-react';
import { useCallsStore } from '@/store/callsStore';
import api from '@/services/api';
import './Softphone.css';

interface UserNumber {
    id: string;
    phoneNumber: string;
}

const DIALPAD_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
];

const Softphone: React.FC = () => {
    const {
        activeCall,
        dialpadNumber,
        selectedFromNumber,
        error,
        setDialpadNumber,
        appendDialpadDigit,
        clearDialpad,
        setSelectedFromNumber,
        makeCall,
        hangup,
        toggleMute,
        toggleHold,
        sendDTMF,
        clearError
    } = useCallsStore();

    const [userNumbers, setUserNumbers] = useState<UserNumber[]>([]);
    const [showCallerSelect, setShowCallerSelect] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // Load user's numbers
    useEffect(() => {
        const loadNumbers = async () => {
            try {
                const response = await api.get('/numbers');
                setUserNumbers(response.data.numbers);
                if (response.data.numbers.length > 0 && !selectedFromNumber) {
                    setSelectedFromNumber(response.data.numbers[0].phoneNumber);
                }
            } catch (err) {
                console.error('Failed to load numbers:', err);
            }
        };
        loadNumbers();
    }, []);

    // Call duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeCall?.status === 'active' && activeCall.startTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - activeCall.startTime!.getTime()) / 1000);
                setCallDuration(elapsed);
            }, 1000);
        } else {
            setCallDuration(0);
        }

        return () => clearInterval(interval);
    }, [activeCall?.status, activeCall?.startTime]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPhoneNumber = (phone: string) => {
        if (phone.startsWith('+1') && phone.length === 12) {
            return `${phone.slice(0, 2)} (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
        }
        return phone;
    };

    const handleDialpadClick = (digit: string) => {
        if (activeCall?.status === 'active') {
            sendDTMF(digit);
        } else {
            appendDialpadDigit(digit);
        }
    };

    const handleCall = () => {
        if (activeCall) {
            hangup();
        } else {
            makeCall(dialpadNumber);
        }
    };

    const isInCall = activeCall && activeCall.status !== 'ended';

    return (
        <div className={`softphone ${isInCall ? 'in-call' : ''}`}>
            {/* Header */}
            <div className="softphone-header">
                <h4>Softphone</h4>
                {error && (
                    <div className="softphone-error" onClick={clearError}>
                        {error}
                    </div>
                )}
            </div>

            {/* Caller ID Selector */}
            {!isInCall && (
                <div className="caller-select">
                    <label>Caller ID</label>
                    <button
                        className="caller-select-btn"
                        onClick={() => setShowCallerSelect(!showCallerSelect)}
                    >
                        <User size={16} />
                        <span>
                            {selectedFromNumber
                                ? formatPhoneNumber(selectedFromNumber)
                                : 'Select number'}
                        </span>
                        <ChevronDown size={16} />
                    </button>

                    {showCallerSelect && (
                        <div className="caller-dropdown">
                            {userNumbers.length === 0 ? (
                                <div className="caller-empty">
                                    No numbers available
                                </div>
                            ) : userNumbers.map((num) => (
                                <button
                                    key={num.id}
                                    className={`caller-option ${num.phoneNumber === selectedFromNumber ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedFromNumber(num.phoneNumber);
                                        setShowCallerSelect(false);
                                    }}
                                >
                                    {formatPhoneNumber(num.phoneNumber)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Call Display */}
            <div className="call-display">
                {isInCall ? (
                    <div className="call-info">
                        <div className="call-status">{activeCall.status}</div>
                        <div className="call-number">
                            {formatPhoneNumber(activeCall.direction === 'outbound' ? activeCall.to : activeCall.from)}
                        </div>
                        <div className="call-timer">{formatDuration(callDuration)}</div>
                    </div>
                ) : (
                    <div className="dialpad-display">
                        <input
                            type="tel"
                            value={dialpadNumber}
                            onChange={(e) => setDialpadNumber(e.target.value)}
                            placeholder="Enter number"
                            className="dialpad-input"
                        />
                        {dialpadNumber && (
                            <button
                                className="dialpad-clear"
                                onClick={() => setDialpadNumber(dialpadNumber.slice(0, -1))}
                            >
                                <Delete size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Dialpad */}
            <div className="dialpad">
                {DIALPAD_KEYS.map((row, rowIndex) => (
                    <div key={rowIndex} className="dialpad-row">
                        {row.map((digit) => (
                            <button
                                key={digit}
                                className="dialpad-key"
                                onClick={() => handleDialpadClick(digit)}
                            >
                                {digit}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Call Controls */}
            <div className="call-controls">
                {isInCall && (
                    <>
                        <button
                            className={`control-btn ${activeCall.isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                        >
                            {activeCall.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            className={`control-btn ${activeCall.isOnHold ? 'active' : ''}`}
                            onClick={toggleHold}
                        >
                            {activeCall.isOnHold ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    </>
                )}

                <button
                    className={`call-btn ${isInCall ? 'hangup' : 'call'}`}
                    onClick={handleCall}
                    disabled={!isInCall && (!dialpadNumber || !selectedFromNumber)}
                >
                    {isInCall ? <PhoneOff size={24} /> : <Phone size={24} />}
                </button>

                {isInCall && (
                    <button className="control-btn" onClick={() => { }}>
                        <Hash size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Softphone;
