//상품 판매
import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { AuthContext } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../utils/config';
import CustomBottomBar from '../components/CustomBottomBar';
import useAuthGuard from '../utils/checkAuthAndRedirect';
import { authFetch } from '../utils/authFetch';

const gradeOptions = ['S', 'A', 'B', 'C'];

export default function ProductCreateScreen({ navigation }) {
  useAuthGuard(navigation);
  const { accessToken, setAccessToken } = useContext(AuthContext);

  const [fruitName, setFruitName] = useState('');
  const [grade, setGrade] = useState('S');
  const [quantity, setQuantity] = useState('');
  const [bundleCount, setBundleCount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);

  const [minPrice, setMinPrice] = useState(null);
  const [avgPrice, setAvgPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [priceInfoAvailable, setPriceInfoAvailable] = useState(false);

  // 토큰 개수 상태
  const [tokenCounts, setTokenCounts] = useState({ S: 0, A: 0, B: 0, C: 0 });

  // 딸기만 사용한다고 했으므로 fruitTypeId=1 고정
  const FRUIT_TYPE_ID = 1;

  // 토큰 카운트 URL 만들기
  const buildTokenCountUrl = () => {
    if (API_ENDPOINTS?.INSPECTION_TOKEN_COUNT) {
      return `${API_ENDPOINTS.INSPECTION_TOKEN_COUNT}?fruitTypeId=${FRUIT_TYPE_ID}`;
    }
    if (API_ENDPOINTS?.USER_ME) {
      return API_ENDPOINTS.USER_ME.replace(
        '/users/me',
        '/inspections/token-count'
      ) + `?fruitTypeId=${FRUIT_TYPE_ID}`;
    }
    return `/inspections/token-count?fruitTypeId=${FRUIT_TYPE_ID}`;
  };

  // 토큰 카운트 로드
  const fetchTokenCount = useCallback(async () => {
    try {
      const url = buildTokenCountUrl();
      console.log('[ProductCreate] 🔎 GET', url);
      const res = await authFetch(url, accessToken, setAccessToken, navigation);
      const json = await res.json().catch(() => null);
      const payload = json?.data ?? json;
      console.log('[ProductCreate] token payload:', payload);

      setTokenCounts({
        S: payload?.S ?? 0,
        A: payload?.A ?? 0,
        B: payload?.B ?? 0,
        C: payload?.C ?? 0,
      });
    } catch (e) {
      console.error('[ProductCreate] token count fetch error:', e);
      setTokenCounts({ S: 0, A: 0, B: 0, C: 0 });
    }
  }, [accessToken]);

  useEffect(() => {
    fetchTokenCount();
  }, [fetchTokenCount]);

  const pickImage = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // 추천 가격 불러오기
  useEffect(() => {
    if (!fruitName || !grade || !quantity) return;

    const fetchEstimate = async () => {
      try {
        const fruitTypeMap = {
          딸기: 1,
          바나나: 2,
          사과: 3,
          배: 4,
          포도: 5,
        };
        const fruitTypeId = fruitTypeMap[fruitName];
        if (!fruitTypeId) {
          console.warn("지원하지 않는 과일 이름:", fruitName);
          return;
        }

        const url = `${API_ENDPOINTS.ESTIMATE_PRICE}?fruitTypeId=${fruitTypeId}&grade=${grade}&quantity=${quantity}`;
        console.log("[Estimate] GET", url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("[Estimate] 서버 에러:", res.status, errText);
          setPriceInfoAvailable(false);
          return;
        }

        const data = await res.json();
        console.log("[Estimate] response JSON:", data);

        const payload = data?.data ?? {};

        if (
          payload.minTotalPrice !== undefined &&
          payload.avgTotalPrice !== undefined &&
          payload.maxTotalPrice !== undefined
        ) {
          setMinPrice(payload.minTotalPrice);
          setAvgPrice(payload.avgTotalPrice);
          setMaxPrice(payload.maxTotalPrice);
          setPriceInfoAvailable(true);
        } else {
          setPriceInfoAvailable(false);
        }
      } catch (e) {
        console.error("추천 가격 API 실패:", e);
        setPriceInfoAvailable(false);
      }
    };

    fetchEstimate();
  }, [fruitName, grade, quantity]);

  const handleSubmit = async () => {
    if (!title || !description || !price || !quantity || !expectedDeliveryDate || !fruitName) {
      Alert.alert('모든 필드를 입력해주세요.');
      return;
    }

    const formData = new FormData();

    const fruitTypeMap = {
      딸기: 1, 
      바나나: 2,
      사과: 3,
      배: 4,
      포도: 5,
    };

    const fruitTypeId = fruitTypeMap[fruitName];
    formData.append('fruitTypeId', fruitTypeId);

    formData.append('grade', grade);
    formData.append('quantity', quantity);
    formData.append('price', price);
    formData.append('title', title);
    formData.append('description', description);

    const formattedDate = expectedDeliveryDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    formData.append('expectedDeliveryDate', formattedDate);

    if (image) {
      const fileExtension = image.uri.split('.').pop();
      const imageType = `image/${fileExtension}`;
      const imageName = image.uri.split('/').pop();

      formData.append('productImage', {
        uri: image.uri,
        name: imageName,
        type: imageType,
      });
    }

    try {
      const res = await fetch(API_ENDPOINTS.PRODUCT_CREATE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      console.log('응답 상태:', res.status);
      const errorText = await res.text();
      console.log('응답 본문:', errorText);

      if (res.ok) {
        Alert.alert('등록 완료');
        navigation.replace('Home');
      } else {
        Alert.alert('등록 실패', errorText);
      }
    } catch (e) {
      console.error('상품 등록 실패:', e);
      Alert.alert('상품 등록 실패', e.message || '네트워크 오류');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'height' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentWrapper}>
            <Text style={styles.label}>과일 이름</Text>
            <TextInput
              style={styles.input}
              value={fruitName}
              onChangeText={setFruitName}
              placeholder="예: 딸기"
            />

            <Text style={styles.label}>등급</Text>
            {gradeOptions.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionButton, grade === g && styles.selectedButton]}
                onPress={() => setGrade(g)}
              >
                <Text>
                  {g} ({tokenCounts[g] ?? 0}개)
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>수량</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="예: 10"
            />

            <Text style={styles.label}>판매 가격</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="직접 입력"
            />

            {priceInfoAvailable ? (
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationText}>추천 가격</Text>
                <Text style={styles.recommendationText}>최저가: {minPrice ?? '-'}원</Text>
                <Text style={styles.recommendationText}>평균가: {avgPrice ?? '-'}원</Text>
                <Text style={styles.recommendationText}>최고가: {maxPrice ?? '-'}원</Text>
              </View>
            ) : (
              <Text style={styles.recommendationText}>추천 가격 정보가 없습니다.</Text>
            )}

            <Text style={styles.label}>묶음 개수</Text>
            <TextInput
              style={styles.input}
              value={bundleCount}
              onChangeText={setBundleCount}
              keyboardType="numeric"
              placeholder="예: 5"
            />

            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>설명</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.label}>배송 예정일</Text>
            <TextInput
              style={styles.input}
              value={expectedDeliveryDate}
              onChangeText={setExpectedDeliveryDate}
              placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text>이미지 선택</Text>
            </TouchableOpacity>

            {image && <Image source={{ uri: image.uri }} style={styles.image} />}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>등록하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <CustomBottomBar navigation={navigation} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginTop: 5,
    borderRadius: 5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    height: 100,
  },
  optionButton: {
    padding: 10,
    marginTop: 5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#aaa',
  },
  selectedButton: {
    backgroundColor: '#d0f0c0',
  },
  imageButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#4caf50',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    marginTop: 10,
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  recommendationBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
  },
});
