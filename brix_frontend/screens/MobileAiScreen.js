// Ai 기반 당도 측정 화면
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/config';

// 업로드 유틸: 상세 로그 + axios 실패 시 fetch 폴백
async function uploadImage(imageUri, grade) {
  const fileUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

  console.log('[uploadImage] start');
  console.log('[uploadImage] URL:', API_ENDPOINTS.GRADE);
  console.log('[uploadImage] fileUri:', fileUri);
  console.log('[uploadImage] grade:', grade);

  const formData = new FormData();
  formData.append('image', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'fruit.jpg',
  });
  formData.append('grade', grade); // 서버가 grade를 받는 경우 대비

  // 1) axios 시도
  try {
    console.log('[uploadImage] axios request...');
    const res = await axios.post(API_ENDPOINTS.GRADE, formData, {
      timeout: 15000,
      validateStatus: () => true,
    });

    console.log('[uploadImage] axios status:', res.status);
    const ct = String(res.headers?.['content-type'] || '');
    console.log('[uploadImage] axios content-type:', ct);

    if (res.status >= 400) {
      console.log('[uploadImage] axios body preview:', typeof res.data === 'string' ? res.data.slice(0, 200) : res.data);
      throw new Error(`HTTP ${res.status}`);
    }

    const payload = res?.data?.data ?? res.data;
    console.log('[uploadImage] raw:', res.data);
    console.log('[uploadImage] parsed:', payload);
    return payload;
  } catch (err) {
    console.log('[uploadImage] axios error name:', err?.name);
    console.log('[uploadImage] axios error message:', err?.message);
    console.log('[uploadImage] axios error status:', err?.response?.status);
    console.log('[uploadImage] axios error data:', err?.response?.data);
    console.log('[uploadImage] fallback to fetch...');
  }

  // 2) fetch 폴백
  try {
    const res = await fetch(API_ENDPOINTS.GRADE, {
      method: 'POST',
      body: formData,
    });

    console.log('[uploadImage][fetch] status:', res.status);
    const ct = res.headers.get('content-type') || '';
    console.log('[uploadImage][fetch] content-type:', ct);

    const text = await res.text();
    if (res.status >= 400) {
      console.log('[uploadImage][fetch] body preview:', text?.slice(0, 200));
      throw new Error(`HTTP ${res.status}`);
    }

    const data = ct.includes('application/json') && text ? JSON.parse(text) : text;
    const payload = data?.data ?? data;
    console.log('[uploadImage][fetch] raw:', payload);
    return payload;
  } catch (e) {
    console.log('[uploadImage][fetch] error:', e?.message);
    throw e;
  }
}

export default function MobileAiScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null); // { brix, inference_ms, ... }
  const [loading, setLoading] = useState(false);

  // 등급 선택 UI 제거: grade는 고정값으로 전송 (기본 'S')
  const grade = 'S';

  const ensureLibraryPermission = async () => {
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!req.granted) {
        Alert.alert('권한 필요', '설정 > 앱 > 권한에서 "사진/미디어"를 허용해주세요.');
        return false;
      }
    }
    return true;
  };

  const ensureCameraPermission = async () => {
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (!perm.granted) {
      const req = await ImagePicker.requestCameraPermissionsAsync();
      if (!req.granted) {
        Alert.alert('권한 필요', '설정 > 앱 > 권한에서 "카메라"를 허용해주세요.');
        return false;
      }
    }
    return true;
  };

  const pickFromLibrary = async () => {
    try {
      const ok = await ensureLibraryPermission();
      if (!ok) return;

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
      });
      console.log('[picker] library result:', res);
      if (res.canceled) return;

      const uri = res.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('오류', '이미지 URI를 가져오지 못했습니다.');
        return;
      }
      await handleUpload(uri);
    } catch (e) {
      console.error('[picker] library error:', e);
      Alert.alert('오류', '앨범을 여는 중 문제가 발생했습니다.');
    }
  };

  const takePhoto = async () => {
    try {
      const ok = await ensureCameraPermission();
      if (!ok) return;

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });
      console.log('[picker] camera result:', res);
      if (res.canceled) return;

      const uri = res.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('오류', '이미지 URI를 가져오지 못했습니다.');
        return;
      }
      await handleUpload(uri);
    } catch (e) {
      console.error('[picker] camera error:', e);
      Alert.alert('오류', '카메라 실행 중 문제가 발생했습니다.');
    }
  };

  const handleUpload = async (uri) => {
    console.log('[MobileAiScreen] onUpload click, uri:', uri, 'grade:', grade);
    setImageUri(uri);
    setResult(null);
    setLoading(true);
    try {
      const data = await uploadImage(uri, grade);
      if (!data) {
        Alert.alert('실패', '업로드/분석에 실패했습니다.');
      } else {
        setResult(data); // { brix, inference_ms, ... }
      }
    } catch (e) {
      Alert.alert('실패', e?.message ?? '업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageUri(null);
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* ⬇️ 제목: marginTop으로 아래로 내림 */}
        <Text style={styles.title}>모바일 AI 당도 측정</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>BETA</Text></View>
          <Text style={styles.subtitle}>직접 촬영한 과일의 등급을 매겨보세요!</Text>
        </View>

        {/* 안내 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>사용 방법</Text>
          <Text style={styles.infoItem}>① 사진을 촬영하거나 앨범에서 선택</Text>
          <Text style={styles.infoItem}>② 업로드하면 당도(Brix)와 추론시간 확인</Text>
          <Text style={styles.infoItem}>③ 결과를 바탕으로 판매 글에 활용</Text>
          <View style={styles.divider} />
          <Text style={styles.tipTitle}>촬영 팁</Text>
          <Text style={styles.tipItem}>• 조명이 균일하고 그림자가 최소화된 곳에서</Text>
          <Text style={styles.tipItem}>• 과일이 화면의 60% 이상 차지하도록 근접 촬영</Text>
          <Text style={styles.tipItem}>• 배경은 단색/깔끔하게</Text>
        </View>

        {/* 이미지 프리뷰 / 비어있을 때의 업로드 박스 */}
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <TouchableOpacity onPress={clearImage} style={styles.linkButton}>
              <Text style={styles.linkText}>다시 선택하기</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={pickFromLibrary}>
            <Text style={styles.uploadEmoji}>🖼️</Text>
            <Text style={styles.uploadTitle}>이미지를 선택하거나 촬영해 주세요</Text>
            <Text style={styles.uploadSub}>하단 버튼으로도 업로드할 수 있어요</Text>
          </TouchableOpacity>
        )}

        {/* 업로드 버튼 */}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={pickFromLibrary}>
              <Text style={styles.buttonText}>앨범에서 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.gray]} onPress={takePhoto}>
              <Text style={styles.buttonText}>촬영해서 업로드</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 결과 카드 */}
        {!!result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              당도(Brix): {typeof result.brix === 'number' ? result.brix.toFixed(2) : String(result.brix)}
            </Text>
            {!!(result?.inference_ms != null) && (
              <Text style={styles.resultSub}>추론시간: {result.inference_ms} ms</Text>
            )}
            {!!(result?.grade != null) && (
              <Text style={styles.resultSub}>등급: {String(result.grade)}</Text>
            )}
          </View>
        )}

        {/* 하단 보조 문구 */}
        <Text style={styles.helperText}>
          * 업로드 속도는 네트워크 상태에 따라 달라질 수 있어요.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollInner: { padding: 20, paddingBottom: 32 },

  // ⬇️ 제목을 아래로 내리기 위해 marginTop 유지/조절
  title: { fontSize: 22, fontWeight: '800', marginTop: 50, marginBottom: 6, color: '#111' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: '#FFE6E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#FF6F61', fontWeight: '700', fontSize: 12 },
  subtitle: { color: '#555', fontSize: 14, fontWeight: '600' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  infoTitle: { fontWeight: '800', marginBottom: 8, fontSize: 15, color: '#222' },
  infoItem: { color: '#333', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 10 },
  tipTitle: { fontWeight: '800', marginBottom: 6, color: '#333' },
  tipItem: { color: '#444', marginBottom: 2 },

  uploadBox: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  uploadEmoji: { fontSize: 36, marginBottom: 8 },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  uploadSub: { marginTop: 6, color: '#666' },

  preview: { width: '100%', height: 240, borderRadius: 12, marginBottom: 8, backgroundColor: '#DDD' },
  linkButton: { alignSelf: 'flex-end', marginBottom: 10 },
  linkText: { color: '#FF6F61', fontWeight: '700' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  button: {
    flex: 1,
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  gray: { backgroundColor: '#444' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  resultBox: { marginTop: 8, backgroundColor: '#fff', padding: 14, borderRadius: 12, elevation: 2 },
  resultText: { fontSize: 18, fontWeight: '800', color: '#111' },
  resultSub: { marginTop: 6, color: '#555' },

  helperText: { marginTop: 10, fontSize: 12, color: '#777' },
});
