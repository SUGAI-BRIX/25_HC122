//비밀번호 찾기
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { API_ENDPOINTS } from '../utils/config';

export default function FindPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const sendCode = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.SEND_CODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        Alert.alert('성공', '인증번호가 이메일로 전송되었습니다.');
        setStep(2);
      } else {
        Alert.alert('실패', '이메일 전송 실패');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('에러', '네트워크 오류');
    }
  };

  const verifyCode = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.VERIFY_CODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const result = await res.text();
      if (res.ok && result === 'true') {
        Alert.alert('성공', '인증 성공! 새 비밀번호를 입력하세요.');
        setStep(3);
      } else {
        Alert.alert('실패', '인증번호가 틀렸습니다.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('에러', '네트워크 오류');
    }
  };

  const resetPassword = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (res.ok) {
        Alert.alert('성공', '비밀번호가 재설정되었습니다.');
        navigation.goBack();
      } else {
        Alert.alert('실패', '비밀번호 재설정 실패');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('에러', '네트워크 오류');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 비밀번호 재설정</Text>

      {step === 1 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="이메일 입력"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={sendCode}>
            <Text style={styles.buttonText}>인증번호 받기</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="인증번호 입력"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={verifyCode}>
            <Text style={styles.buttonText}>인증 확인</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="새 비밀번호 입력"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.button} onPress={resetPassword}>
            <Text style={styles.buttonText}>비밀번호 재설정</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});