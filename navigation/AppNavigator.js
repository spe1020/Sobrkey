import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import MeetingScreen from '../screens/MeetingScreen';
import SupportScreen from '../screens/SupportScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import theme
import { colors } from '../styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home stack navigator
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Meeting" component={MeetingScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

// Main tab navigator
const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Journal') {
            iconName = 'book';
          } else if (route.name === 'Meeting') {
            iconName = 'users';
          } else if (route.name === 'Support') {
            iconName = 'message-circle';
          } else if (route.name === 'Emergency') {
            iconName = 'alert-triangle';
          }
          
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#f0f0f0',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Meeting" component={MeetingScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
      <Tab.Screen 
        name="Emergency" 
        component={EmergencyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size} color="#e74c3c" />
          ),
          tabBarLabel: ({ focused }) => {
            return focused ? <EmergencyTabLabel /> : null;
          }
        }}
      />
    </Tab.Navigator>
  );
};

// Custom label for emergency tab to make it more noticeable
const EmergencyTabLabel = () => {
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: '#e74c3c',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 5,
      }}
    >
      <Feather name="alert-triangle" size={12} color="#fff" style={{ marginRight: 4 }} />
    </TouchableOpacity>
  );
};

export default AppNavigator;
