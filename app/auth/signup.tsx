import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const roles = ['Client', 'Manager', 'Technician', 'Storekeeper', 'Admin'];
const specializations = ['Electrical', 'Plumbing', 'HVAC', 'General', 'Cleaning'];

export default function SignUpScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [specialization, setSpecialization] = useState('');

  const handleSignUp = () => {
    if (!fullName || !email || !password || !role || (role === 'Technician' && !specialization)) {
      alert('Please fill in all fields');
      return;
    }

    navigation.navigate('SignIn');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#aaa"
        />

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Select Role</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={role} onValueChange={(val) => setRole(val)} style={styles.picker}>
            <Picker.Item label="-- Select Role --" value="" />
            {roles.map((r) => (
              <Picker.Item key={r} label={r} value={r} />
            ))}
          </Picker>
        </View>

        {role === 'Technician' && (
          <>
            <Text style={styles.label}>Specialization</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={specialization}
                onValueChange={(val) => setSpecialization(val)}
                style={styles.picker}
              >
                <Picker.Item label="-- Select Specialization --" value="" />
                {specializations.map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.linkText} onPress={() => navigation.navigate('SignIn')}>
            Sign In
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f4f7fe',
  },
  container: {
    padding: 24,
    backgroundColor: '#f4f7fe',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2b2d42',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    marginTop: 16,
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderColor: '#ccc',
    marginVertical: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    backgroundColor: '#4e89ff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#555',
  },
  linkText: {
    color: '#4e89ff',
    fontWeight: 'bold',
  },
});
