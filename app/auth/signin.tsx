import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const roles = ['Client', 'Manager', 'Technician', 'Storekeeper', 'Admin'];

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Client');

  const handleLogin = () => {
    if (!email || !password || !role) {
      alert('Please fill all fields');
      return;
    }

    const routes: any = {
      Client: 'ClientDashboard',
      Manager: 'ManagerScreen',
      Technician: 'TechnicianDashboard',
      Storekeeper: 'StorekeeperDashboard',
      Admin: 'AdminDashboard',
    };
    navigation.navigate(routes[role]);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🔧</Text>
        </View>
        <Text style={styles.title}>FacilityPro</Text>
        <Text style={styles.subtitle}>
          Industrial & Commercial Maintenance Management
        </Text>

        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={role}
            onValueChange={(val) => setRole(val)}
            style={styles.picker}
          >
            {roles.map((r) => (
              <Picker.Item key={r} label={r} value={r} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrapper: {
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 28,
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: { width: '100%' },
  loginButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: {
    textAlign: 'center',
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '500',
  },
});
