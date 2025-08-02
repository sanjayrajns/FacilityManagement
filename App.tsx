import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from './app/auth/signin';
import SignUpScreen from './app/auth/signup';
import ClientDashboard from './app/screens/ClientDashboard';
import ManagerScreen from './app/screens/ManagerScreen';
import StorekeeperDashboard from './app/screens/StorekeeperDashboard';
import AdminDashboard from './app/screens/AdminDashboard';
import AllInOneNavigator from './app/screens/ClientDashboard';
// Placeholder dashboard components (replace these with real ones later)
// import ClientDashboard from './app/screens/client/ClientDashboard';
// import ManagerDashboard from './app/screens/manager/ManagerDashboard';
import TechnicianDashboard from './app/screens//TechnicianDashboard';
// import StorekeeperDashboard from './app/screens/storekeeper/StorekeeperDashboard';
// import AdminDashboard from './app/screens/admin/AdminDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
        <Stack.Screen name="TechnicianDashboard" component={TechnicianDashboard}></Stack.Screen>
        <Stack.Screen name="ManagerScreen" component={ManagerScreen} />
        <Stack.Screen name="StorekeeperDashboard" component={StorekeeperDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
