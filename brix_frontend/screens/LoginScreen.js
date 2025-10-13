// 로그인 화면
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../utils/config';
import { useMockContext } from '../contexts/MockContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();

  // 로그인 후 자동 이동
  useEffect(() => {
    if (accessToken) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [accessToken]);

  const handleLogin = async () => {
    if (useMock) {
      if (username === 'A' && password === 'a') {
        const mockToken = 'mock.token.value.123';
        await AsyncStorage.setItem('accessToken', mockToken);
        setAccessToken(mockToken);
        setMessage('로그인 성공! (mock)');
      } else {
        setMessage('아이디 또는 비밀번호가 틀렸습니다. (mock)');
      }
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok && data) {
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        setAccessToken(data.data.accessToken);
        setMessage('로그인 성공!');
      } else {
        setMessage((data && data.message) || '로그인 실패');
      }
    } catch (error) {
      setMessage('네트워크 오류');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* 로고 이미지 */}
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>당도 측정 플랫폼 로그인</Text>

          {/* 입력창 */}
          <TextInput
            style={styles.input}
            placeholder="아이디"
            placeholderTextColor="#aaa"
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#aaa"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          {/* 로그인 버튼 */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>로그인</Text>
          </TouchableOpacity>

          {/* 결과 메시지 */}
          {message !== '' && (
            <Text style={styles.message}>{String(message)}</Text>
          )}

          {/* 추가 링크 */}
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>회원가입 하러가기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FindPassword')}>
            <Text style={styles.linkGray}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9f9f9' },
  logo: {
    width: 160,
    height: 80,
    alignSelf: 'center',
    marginBottom: 12,
  },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  message: { marginTop: 12, textAlign: 'center', color: '#333' },
  link: { marginTop: 20, color: '#3498db', textAlign: 'center', textDecorationLine: 'underline' },
  linkGray: { marginTop: 12, color: '#888', textAlign: 'center', textDecorationLine: 'underline' },
});
