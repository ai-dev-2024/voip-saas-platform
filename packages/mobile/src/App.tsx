import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import DialerScreen from './screens/DialerScreen';
import CallsScreen from './screens/CallsScreen';
import SettingsScreen from './screens/SettingsScreen';

// Stores
import { useAuthStore } from './store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dark theme matching web app
const VoIPDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: '#00AFF0',
        background: '#0D1117',
        card: '#161B22',
        text: '#E6EDF3',
        border: '#30363D',
    },
};

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Dialer':
                            iconName = focused ? 'keypad' : 'keypad-outline';
                            break;
                        case 'Calls':
                            iconName = focused ? 'call' : 'call-outline';
                            break;
                        case 'Settings':
                            iconName = focused ? 'settings' : 'settings-outline';
                            break;
                        default:
                            iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#00AFF0',
                tabBarInactiveTintColor: '#8B949E',
                tabBarStyle: {
                    backgroundColor: '#161B22',
                    borderTopColor: '#30363D',
                },
                headerStyle: {
                    backgroundColor: '#161B22',
                },
                headerTintColor: '#E6EDF3',
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Dialer" component={DialerScreen} />
            <Tab.Screen name="Calls" component={CallsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const colorScheme = useColorScheme();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        // Could add splash screen here
        return null;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <NavigationContainer theme={VoIPDarkTheme}>
                    <StatusBar style="light" />
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {isAuthenticated ? (
                            <Stack.Screen name="Main" component={TabNavigator} />
                        ) : (
                            <>
                                <Stack.Screen name="Login" component={LoginScreen} />
                                <Stack.Screen name="Register" component={RegisterScreen} />
                            </>
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
