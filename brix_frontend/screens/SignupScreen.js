// 회원 가입
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS } from '../utils/config';

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    nickname: '',
    role: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState('');

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleSignup = async () => {
  const { username, password, email, nickname, role } = form;

  if (!username || !password || !email || !nickname || !role) {
    setMessage('모든 항목을 입력해주세요.');
    return;
  }

  const formData = new FormData();

  // request 필드를 application/json으로 명시
  formData.append('request', {
    string: JSON.stringify({ username, password, email, nickname, role }),
    name: 'request.json',
    type: 'application/json',
  });

  // 이미지가 있을 경우 추가
  if (profileImage) {
    formData.append('profileImage', {
      uri: profileImage.uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
  }

  try {
    const response = await fetch(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📡 응답 상태 코드:', response.status);

    if (response.ok) {
      setMessage('회원가입 성공!');
      Alert.alert('회원가입 완료', '로그인 페이지로 이동합니다.');
      navigation.navigate('Login');
    } else {
      let errorMessage = '회원가입 실패';

      try {
        const text = await response.text();
        console.log('응답 본문:', text);
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        console.warn('응답 파싱 실패:', e);
      }

      setMessage(errorMessage);
    }
  } catch (error) {
    console.error('회원가입 중 오류:', error);
    setMessage('서버 오류가 발생했습니다.');
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      {/* 기본 입력 필드 */}
      {['username', 'password', 'email', 'nickname'].map((key) => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={key}
          secureTextEntry={key === 'password'}
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
        />
      ))}

      {/* 역할 선택 */}
      <View style={styles.roleContainer}>
        {['CONSUMER', 'SELLER'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.roleButton,
              form.role === r && styles.roleButtonSelected,
            ]}
            onPress={() => setForm({ ...form, role: r })}
          >
            <Text
              style={
                form.role === r ? styles.roleTextSelected : styles.roleText
              }
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 이미지 선택 */}
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        <Text style={styles.imagePickerText}>프로필 이미지 선택</Text>
      </TouchableOpacity>

      {profileImage && (
        <Image source={{ uri: profileImage.uri }} style={styles.previewImage} />
      )}

      <Button title="가입하기" onPress={handleSignup} />

      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  roleButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleText: {
    color: '#333',
  },
  roleTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagePicker: {
    backgroundColor: '#ddd',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 150,
    marginBottom: 12,
    borderRadius: 8,
  },
  message: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
});
