import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const DIALPAD_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
];

export default function DialerScreen() {
    const [number, setNumber] = useState('');

    const handlePress = async (digit: string) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNumber((prev) => prev + digit);
    };

    const handleDelete = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNumber((prev) => prev.slice(0, -1));
    };

    const handleCall = async () => {
        if (!number) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // TODO: Implement call functionality
        console.log('Calling:', number);
    };

    const formatNumber = (num: string) => {
        if (num.startsWith('+1') || num.length <= 3) return num;
        if (num.length <= 6) return `(${num.slice(0, 3)}) ${num.slice(3)}`;
        return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6, 10)}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Display */}
            <View style={styles.display}>
                <Text style={styles.number} numberOfLines={1} adjustsFontSizeToFit>
                    {formatNumber(number) || 'Enter number'}
                </Text>
                {number.length > 0 && (
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Ionicons name="backspace-outline" size={28} color="#8B949E" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dialpad */}
            <View style={styles.dialpad}>
                {DIALPAD_KEYS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.dialpadRow}>
                        {row.map((digit) => (
                            <TouchableOpacity
                                key={digit}
                                style={styles.key}
                                onPress={() => handlePress(digit)}
                            >
                                <Text style={styles.keyText}>{digit}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            {/* Call Button */}
            <View style={styles.callContainer}>
                <TouchableOpacity
                    style={[styles.callBtn, !number && styles.callBtnDisabled]}
                    onPress={handleCall}
                    disabled={!number}
                >
                    <Ionicons name="call" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    display: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
        minHeight: 120,
    },
    number: {
        fontSize: 32,
        fontWeight: '300',
        color: '#E6EDF3',
        letterSpacing: 2,
    },
    deleteBtn: {
        position: 'absolute',
        right: 20,
        padding: 10,
    },
    dialpad: {
        flex: 1,
        paddingHorizontal: 40,
        gap: 12,
    },
    dialpadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#21262D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 28,
        fontWeight: '400',
        color: '#E6EDF3',
    },
    callContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    callBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#0AA30A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0AA30A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    callBtnDisabled: {
        opacity: 0.5,
    },
});
