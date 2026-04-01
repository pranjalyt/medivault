// App.js
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RecordsScreen from "./src/screens/RecordsScreen";
import VitalsScreen from "./src/screens/VitalsScreen";
import QRScreen from "./src/screens/QRScreen";
import AIScreen from "./src/screens/AIScreen";

// Simple global state — replace with Context/Redux later
export const AppContext = React.createContext(null);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        Home: "home-outline",
                        Records: "document-text-outline",
                        Vitals: "pulse-outline",
                        QR: "qr-code-outline",
                        AI: "sparkles-outline",
                    };
                    return <Ionicons name={icons[route.name] || "ellipse-outline"} size={size} color={color} />;
                },
                tabBarActiveTintColor: "#2563EB",
                tabBarInactiveTintColor: "#94A3B8",
                tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E2E8F0", paddingBottom: 4 },
                headerStyle: { backgroundColor: "#2563EB" },
                headerTintColor: "#FFFFFF",
                headerTitleStyle: { fontWeight: "700" },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: "MediVault 🏥" }} />
            <Tab.Screen name="Records" component={RecordsScreen} options={{ title: "Records" }} />
            <Tab.Screen name="Vitals" component={VitalsScreen} options={{ title: "Vitals" }} />
            <Tab.Screen name="QR" component={QRScreen} options={{ title: "QR Access" }} />
            <Tab.Screen name="AI" component={AIScreen} options={{ title: "AI Assistant" }} />
        </Tab.Navigator>
    );
}

export default function App() {
    const [currentUser, setCurrentUser] = useState(null); // no auth yet — set manually

    return (
        <SafeAreaProvider>
            <AppContext.Provider value={{ currentUser, setCurrentUser }}>
                <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="Profile" component={ProfileScreen}
                            options={{ headerShown: true, title: "Profile", headerStyle: { backgroundColor: "#2563EB" }, headerTintColor: "#fff" }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </AppContext.Provider>
        </SafeAreaProvider>
    );
}