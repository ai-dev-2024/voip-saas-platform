import { create } from 'zustand';
import api from '@/services/api';

type CallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'on-hold' | 'ended';
type CallDirection = 'inbound' | 'outbound';

interface ActiveCall {
    id: string;
    callControlId?: string;
    direction: CallDirection;
    from: string;
    to: string;
    status: CallStatus;
    startTime?: Date;
    duration: number;
    isMuted: boolean;
    isOnHold: boolean;
}

interface CallsStoreState {
    // State
    activeCall: ActiveCall | null;
    recentCalls: ActiveCall[];
    isWebRTCReady: boolean;
    webrtcToken: string | null;
    sipUsername: string | null;
    selectedFromNumber: string | null;
    dialpadNumber: string;
    error: string | null;

    // Actions
    setDialpadNumber: (number: string) => void;
    appendDialpadDigit: (digit: string) => void;
    clearDialpad: () => void;
    setSelectedFromNumber: (number: string | null) => void;

    initWebRTC: () => Promise<void>;
    makeCall: (to: string) => Promise<void>;
    answerCall: () => void;
    hangup: () => void;
    toggleMute: () => void;
    toggleHold: () => void;
    sendDTMF: (digit: string) => void;

    setCallStatus: (status: CallStatus) => void;
    setActiveCall: (call: ActiveCall | null) => void;
    clearError: () => void;
}

export const useCallsStore = create<CallsStoreState>((set, get) => ({
    // Initial state
    activeCall: null,
    recentCalls: [],
    isWebRTCReady: false,
    webrtcToken: null,
    sipUsername: null,
    selectedFromNumber: null,
    dialpadNumber: '',
    error: null,

    // Dialpad actions
    setDialpadNumber: (number) => set({ dialpadNumber: number }),

    appendDialpadDigit: (digit) => set((state) => ({
        dialpadNumber: state.dialpadNumber + digit
    })),

    clearDialpad: () => set({ dialpadNumber: '' }),

    setSelectedFromNumber: (number) => set({ selectedFromNumber: number }),

    // Initialize WebRTC
    initWebRTC: async () => {
        try {
            const response = await api.get('/calls/webrtc-token');
            set({
                webrtcToken: response.data.token,
                sipUsername: response.data.sipUsername,
                isWebRTCReady: true,
                error: null
            });
        } catch (err) {
            set({
                error: 'Failed to initialize WebRTC',
                isWebRTCReady: false
            });
        }
    },

    // Make outbound call
    makeCall: async (to) => {
        const { selectedFromNumber, dialpadNumber } = get();
        const destination = to || dialpadNumber;

        if (!destination) {
            set({ error: 'Please enter a phone number' });
            return;
        }

        if (!selectedFromNumber) {
            set({ error: 'Please select a caller ID' });
            return;
        }

        // Create active call
        const call: ActiveCall = {
            id: Date.now().toString(),
            direction: 'outbound',
            from: selectedFromNumber,
            to: destination,
            status: 'connecting',
            duration: 0,
            isMuted: false,
            isOnHold: false
        };

        set({ activeCall: call, error: null });

        try {
            const response = await api.post('/calls/initiate', {
                from: selectedFromNumber,
                to: destination
            });

            set((state) => ({
                activeCall: state.activeCall ? {
                    ...state.activeCall,
                    callControlId: response.data.callId,
                    status: 'ringing'
                } : null
            }));
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Call failed',
                activeCall: null
            });
        }
    },

    // Answer inbound call
    answerCall: () => {
        set((state) => ({
            activeCall: state.activeCall ? {
                ...state.activeCall,
                status: 'active',
                startTime: new Date()
            } : null
        }));
    },

    // Hang up call
    hangup: async () => {
        const { activeCall } = get();

        if (activeCall?.callControlId) {
            try {
                await api.post(`/calls/${activeCall.callControlId}/hangup`);
            } catch (err) {
                console.error('Hangup error:', err);
            }
        }

        // Add to recent calls
        if (activeCall) {
            set((state) => ({
                recentCalls: [{
                    ...activeCall,
                    status: 'ended'
                }, ...state.recentCalls].slice(0, 50)
            }));
        }

        set({ activeCall: null, dialpadNumber: '' });
    },

    // Toggle mute
    toggleMute: () => {
        set((state) => ({
            activeCall: state.activeCall ? {
                ...state.activeCall,
                isMuted: !state.activeCall.isMuted
            } : null
        }));
    },

    // Toggle hold
    toggleHold: () => {
        set((state) => ({
            activeCall: state.activeCall ? {
                ...state.activeCall,
                isOnHold: !state.activeCall.isOnHold,
                status: state.activeCall.isOnHold ? 'active' : 'on-hold'
            } : null
        }));
    },

    // Send DTMF
    sendDTMF: (digit) => {
        console.log('DTMF:', digit);
        // Will integrate with Telnyx SDK
    },

    // Set call status
    setCallStatus: (status) => {
        set((state) => ({
            activeCall: state.activeCall ? {
                ...state.activeCall,
                status,
                startTime: status === 'active' ? new Date() : state.activeCall.startTime
            } : null
        }));
    },

    setActiveCall: (call) => set({ activeCall: call }),

    clearError: () => set({ error: null })
}));

export default useCallsStore;
