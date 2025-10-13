// 마이페이지
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';
import { useMockContext } from '../contexts/MockContext';
import CustomBottomBar from '../components/CustomBottomBar';
import LogoImage from '../assets/logo.png';
import { Ionicons } from '@expo/vector-icons';

export default function MyPageScreen({ navigation }) {
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);

  // 등급 토큰 상태
  const [tokenCount, setTokenCount] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  // 딸기만 사용한다고 했으므로 고정
  const FRUIT_TYPE_ID = 1;

  // 토큰 카운트 URL (엔드포인트 키가 없을 때도 대비)
  const buildTokenCountUrl = () => {
    if (API_ENDPOINTS?.INSPECTION_TOKEN_COUNT) {
      return `${API_ENDPOINTS.INSPECTION_TOKEN_COUNT}?fruitTypeId=${FRUIT_TYPE_ID}`;
    }
    if (API_ENDPOINTS?.USER_ME) {
      return API_ENDPOINTS.USER_ME.replace('/users/me', '/inspections/token-count') + `?fruitTypeId=${FRUIT_TYPE_ID}`;
    }
    return `/inspections/token-count?fruitTypeId=${FRUIT_TYPE_ID}`;
  };

  // 토큰 카운트 로드
  const fetchTokenCount = useCallback(async () => {
    if (useMock) {
      setTokenCount({ S: 20, A: 10, B: 5, C: 0 });
      setTokenLoading(false);
      return;
    }
    setTokenLoading(true);
    try {
      const url = buildTokenCountUrl();
      console.log('[MyPage] 🔎 GET', url);
      const res = await authFetch(url, accessToken, setAccessToken, navigation, {}, useMock);
      const json = await res.json().catch(() => null);
      const payload = json?.data ?? json;
      console.log('[MyPage] token payload:', payload);

      setTokenCount({
        S: payload?.S ?? 0,
        A: payload?.A ?? 0,
        B: payload?.B ?? 0,
        C: payload?.C ?? 0,
      });
    } catch (e) {
      console.error('[MyPage] token count fetch error:', e);
      setTokenCount({ S: 0, A: 0, B: 0, C: 0 });
    } finally {
      setTokenLoading(false);
    }
  }, [useMock, accessToken]);

  // 유저 정보
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (useMock) {
        try {
          const mockData = {
            username: '농부1',
            nickname: '사과 장인',
            email: 'farmer1@gmail.com',
            role: 'USER',
            profileImageUrl: null,
          };
          setUserInfo(mockData);
          setNickname(mockData.nickname);
          setEmail(mockData.email);
        } catch (e) {
          console.error('⚠️ mock 데이터 세팅 실패:', e);
        } finally {
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const res = await authFetch(API_ENDPOINTS.USER_ME, accessToken, setAccessToken, navigation, {}, useMock);
        const data = await res.json();
        setUserInfo(data.data);
        setNickname(data.data.nickname || '');
        setEmail(data.data.email || '');
      } catch (e) {
        console.error('유저 정보 가져오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [useMock]);

  // 최초/포커스 때마다 토큰 새로고침
  useEffect(() => { fetchTokenCount(); }, [fetchTokenCount]);
  useFocusEffect(useCallback(() => { fetchTokenCount(); }, [fetchTokenCount]));

  // 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  // 프로필 업데이트
  const handleProfileUpdate = async () => {
    const formData = new FormData();
    formData.append('request', {
      string: JSON.stringify({ nickname, email }),
      name: 'request.json',
      type: 'application/json',
    });
    if (image) {
      formData.append('profileImage', {
        uri: image.uri,
        name: image.fileName || 'profile.jpg',
        type: image.type || 'image/jpeg',
      });
    }

    try {
      const res = await authFetch(
        API_ENDPOINTS.USER_ME,
        accessToken,
        setAccessToken,
        navigation,
        { method: 'PUT', body: formData },
        useMock
      );
      const responseText = await res.text();
      console.log('응답 status:', res.status);
      console.log('응답 body:', responseText);

      if (res.ok) {
        Alert.alert('성공', '회원 정보가 수정되었습니다.');
        setEditMode(false);
      } else {
        Alert.alert('오류', '수정에 실패했습니다.');
      }
    } catch (e) {
      console.error('예외 발생:', e);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    try {
      const res = await authFetch(
        API_ENDPOINTS.CHANGE_PASSWORD,
        accessToken,
        setAccessToken,
        navigation,
        {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword }),
          headers: { 'Content-Type': 'application/json' },
        },
        useMock
      );
      if (res.ok) {
        Alert.alert('성공', '비밀번호가 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
      } else Alert.alert('오류', '비밀번호 변경 실패');
    } catch (e) {
      console.error(e);
    }
  };

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    Alert.alert('정말 탈퇴하시겠습니까?', '이 작업은 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          try {
            const res = await authFetch(
              API_ENDPOINTS.USER_ME,
              accessToken,
              setAccessToken,
              navigation,
              { method: 'DELETE' },
              useMock
            );
            const responseText = await res.text();
            console.log('응답 status:', res.status);
            console.log('응답 body:', responseText);

            if (res.ok) {
              Alert.alert('탈퇴 완료', '회원 탈퇴가 처리되었습니다.');
              setAccessToken(null);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } else {
              if (responseText.includes('foreign key constraint fails')) {
                Alert.alert('오류', '등록한 상품을 먼저 삭제한 후 탈퇴해주세요.');
              } else {
                Alert.alert('오류', '탈퇴 실패');
              }
            }
          } catch (e) {
            console.error('예외 발생:', e);
            Alert.alert('오류', '예상치 못한 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="gray" /></View>;
  if (!userInfo) return <View style={styles.center}><Text>유저 정보를 불러올 수 없습니다.</Text></View>;

  const TokenBadge = ({ grade, count }) => (
    <View style={[styles.badge, styles[`badge${grade}`]]}>
      <Text style={styles.badgeGrade}>{grade}</Text>
      <Text style={styles.badgeCount}>{count ?? 0}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* 햄버거 버튼 */}
      <TouchableOpacity style={styles.menuIcon} onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu" size={28} color="#333" />
      </TouchableOpacity>

      {/* 햄버거 메뉴 모달 */}
      {menuVisible && (
        <View style={styles.menuOverlay}>
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>메뉴</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setEditMode(true); setMenuVisible(false); }}>
              <Text style={styles.menuText}>회원 정보 수정</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('MyOrders'); }}>
              <Text style={styles.menuText}>내가 구매한 품목</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <Text style={styles.closeText}>닫기 ✖</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 스크롤 가능한 콘텐츠 */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={LogoImage} style={styles.logo} />

          <TouchableOpacity onPress={pickImage}>
            {image?.uri ? (
              <Image source={{ uri: image.uri }} style={styles.profileImage} />
            ) : userInfo.profileImageUrl ? (
              <Image source={{ uri: userInfo.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfile} />
            )}
          </TouchableOpacity>

          {/* 등급별 토큰 카드 */}
          <View style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <Text style={styles.cardTitle}>내 등급 토큰</Text>
              <TouchableOpacity onPress={fetchTokenCount} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={18} color="#d9534f" />
                <Text style={styles.refreshText}>새로고침</Text>
              </TouchableOpacity>
            </View>

            {tokenLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <View style={styles.tokenRow}>
                <TokenBadge grade="S" count={tokenCount?.S} />
                <TokenBadge grade="A" count={tokenCount?.A} />
                <TokenBadge grade="B" count={tokenCount?.B} />
                <TokenBadge grade="C" count={tokenCount?.C} />
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디</Text>
            <Text style={styles.readonlyInput}>{userInfo.username}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput value={nickname} onChangeText={setNickname} style={styles.textInput} editable={editMode} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput value={email} onChangeText={setEmail} style={styles.textInput} editable={editMode} />
          </View>

          {editMode && (
            <>
              <TextInput
                placeholder="현재 비밀번호"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.textInput}
              />
              <TextInput
                placeholder="새 비밀번호"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.textInput}
              />
              <TouchableOpacity style={styles.redButton} onPress={handlePasswordChange}>
                <Text style={styles.buttonText}>비밀번호 변경</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.redButton} onPress={handleProfileUpdate}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.redButton} onPress={() => setEditMode(!editMode)}>
              <Text style={styles.buttonText}>{editMode ? '취소' : '회원 정보 수정'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.redButton} onPress={handleDeleteAccount}>
              <Text style={styles.buttonText}>회원 탈퇴</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 하단 고정 바 */}
      <CustomBottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    minHeight: '100%',
    padding: 24,
    alignItems: 'center',
    paddingBottom: 120, // 하단바에 가리지 않게 여유
  },
  logo: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    marginTop: 40,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    marginBottom: 18,
  },
  defaultProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
    marginBottom: 18,
  },

  // ✅ 토큰 카드
  tokenCard: {
    width: '100%',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd6d6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  refreshText: {
    color: '#d9534f',
    fontWeight: '700',
    fontSize: 12,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeGrade: { fontSize: 12, opacity: 0.75 },
  badgeCount: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  badgeS: { borderColor: '#c62828' },
  badgeA: { borderColor: '#2e7d32' },
  badgeB: { borderColor: '#f9a825' },
  badgeC: { borderColor: '#9e9e9e' },
  tokenNote: { marginTop: 8, fontSize: 11, color: '#777' },

  inputGroup: { width: '100%', marginBottom: 12 },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e57373',
    paddingVertical: 6,
    fontSize: 16,
    color: '#000',
  },
  readonlyInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e57373',
    paddingVertical: 6,
    fontSize: 16,
    color: '#555',
  },
  redButton: {
    flex: 1,
    backgroundColor: '#d9534f',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 10,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  menuIcon: { position: 'absolute', top: 40, left: 24, zIndex: 10 },
  menuOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  menuBox: {
    width: 250, backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 16, color: '#333' },
  closeButton: { marginTop: 20, alignSelf: 'center' },
  closeText: { color: '#d9534f', fontWeight: 'bold' },
});
