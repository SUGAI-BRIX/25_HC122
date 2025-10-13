//리뷰 쓰기
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useMockContext } from '../contexts/MockContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';
import CustomBottomBar from '../components/CustomBottomBar';

export default function ReviewWriteScreen({ route, navigation }) {
  const { productId: pidParam, orderId, title } = route.params || {};
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();

  const [productId, setProductId] = useState(pidParam ?? null);
  const [productImageUrl, setProductImageUrl] = useState(null);
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  const toJsonLenient = useCallback(async (resLike) => {
    if (!resLike) return null;
    const isFetch = typeof resLike === 'object' && 'status' in resLike && (resLike.text || resLike.json);
    if (isFetch) {
      try {
        const txt = typeof resLike.text === 'function' ? await resLike.text() : null;
        if (!txt || txt.trim() === '') return null;
        try { return JSON.parse(txt); } catch { return { text: txt }; }
      } catch { return null; }
    }
    return resLike;
  }, []);

  const extractArrayPayload = (root) => {
    const r = root?.data ?? root;
    if (Array.isArray(r?.data?.content)) return r.data.content;
    if (Array.isArray(r?.data?.data))    return r.data.data;
    if (Array.isArray(r?.data))          return r.data;
    if (Array.isArray(r?.content))       return r.content;
    if (Array.isArray(r))                return r;
    return [];
  };

  const extractPidFromDetail = (data) => {
    const ok = (v) => v != null && String(v).trim() !== '';
    if (!data || typeof data !== 'object') return null;
    const direct = data.productId ?? data?.product?.id ?? data?.product?.productId ?? null;
    if (ok(direct)) return direct;
    const arrays = [data.orderItems, data.items, data.lineItems, data.lines, data.orderItemList].filter(Array.isArray);
    for (const arr of arrays) for (const it of arr) {
      const cand = it?.productId ?? it?.product?.id ?? it?.product?.productId ?? null;
      if (ok(cand)) return cand;
    }
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) { for (const it of v) { const c = extractPidFromDetail(it); if (ok(c)) return c; } }
      else if (v && typeof v === 'object') { const c = extractPidFromDetail(v); if (ok(c)) return c; }
    }
    return null;
  };

  const resolveFromOrderDetail = useCallback(async (oid) => {
    if (!oid || !API_ENDPOINTS?.ORDER_DETAIL) return null;
    const url = API_ENDPOINTS.ORDER_DETAIL(oid);
    console.log('[ReviewWrite] 🔎 ORDER_DETAIL =', url);
    try {
      const res  = await authFetch(url, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
      const json = await toJsonLenient(res);
      console.log('[ReviewWrite] ORDER_DETAIL json keys =', json && Object.keys(json || {}));
      const data = json?.data ?? json ?? null;

      // 상품 이미지 세팅
      if (data?.product?.productImageUrl) {
        setProductImageUrl(data.product.productImageUrl);
      }

      const pid  = extractPidFromDetail(data);
      console.log('[ReviewWrite] pid from ORDER_DETAIL =', pid);
      return pid ?? null;
    } catch (e) {
      console.warn('[ReviewWrite] ORDER_DETAIL failed:', e);
      return null;
    }
  }, [accessToken, setAccessToken, navigation, useMock, toJsonLenient]);

  const searchProductIdByTitle = useCallback(async (name) => {
    if (!name) return null;
    const cands = [];
    if (API_ENDPOINTS?.SEARCH) {
      cands.push(`${API_ENDPOINTS.SEARCH}?query=${encodeURIComponent(name)}`);
      cands.push(`${API_ENDPOINTS.SEARCH}?keyword=${encodeURIComponent(name)}`);
      cands.push(`${API_ENDPOINTS.SEARCH}?title=${encodeURIComponent(name)}`);
    }
    for (const url of cands) {
      try {
        console.log('[ReviewWrite] 🔎 SEARCH =', url);
        const res  = await authFetch(url, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
        const json = await toJsonLenient(res);
        const arr  = extractArrayPayload(json).map(x => ({
          id: x?.id ?? x?.productId ?? null,
          title: (x?.title ?? x?.productTitle ?? '').trim(),
          createdAt: x?.createdAt ?? x?.updatedAt ?? x?.date ?? null,
          productImageUrl: x?.productImageUrl ?? null // 이미지 가져오기
        })).filter(x => x.id != null);
        if (arr.length === 0) continue;

        // 첫 상품 이미지 저장
        if (arr[0]?.productImageUrl) {
          setProductImageUrl(arr[0].productImageUrl);
        }

        const exact = arr.filter(a => a.title === name.trim());
        if (exact.length > 0) {
          exact.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
          console.log('[ReviewWrite] pid from SEARCH(exact) =', exact[0].id);
          return exact[0].id;
        }
        console.log('[ReviewWrite] pid from SEARCH(first) =', arr[0].id);
        return arr[0].id;
      } catch (e) {
        console.warn('[ReviewWrite] SEARCH failed:', e);
      }
    }
    return null;
  }, [accessToken, setAccessToken, navigation, useMock, toJsonLenient]);

  const resolveProductIdFlow = useCallback(async () => {
    if (productId) return productId;
    setResolving(true);
    try {
      let pid = null;
      if (orderId) pid = await resolveFromOrderDetail(orderId);
      if (!pid && title) pid = await searchProductIdByTitle(title);
      if (pid) { setProductId(pid); return pid; }
      return null;
    } finally {
      setResolving(false);
    }
  }, [productId, orderId, title, resolveFromOrderDetail, searchProductIdByTitle]);

  // mount 시도(비동기)
  useEffect(() => {
    (async () => {
      if (!productId && (orderId || title)) {
        const pid = await resolveProductIdFlow();
        if (!pid) console.warn('[ReviewWrite] ❌ productId resolve failed on mount');
      }
    })();
  }, [productId, orderId, title, resolveProductIdFlow]);

  const validate = () => {
    if (!productId) { Alert.alert('오류', '상품 ID를 찾지 못했습니다.'); return false; }
    const n = Number(rating);
    if (!(n >= 1 && n <= 5)) { Alert.alert('오류', '평점은 1~5 사이 숫자여야 합니다.'); return false; }
    if (!content.trim()) { Alert.alert('오류', '리뷰 내용을 입력해 주세요.'); return false; }
    return true;
  };

  const onSubmit = useCallback(async () => {
    console.log('[ReviewWrite] onSubmit pressed');
    if (!productId) {
      const pid = await resolveProductIdFlow();
      if (!pid) { Alert.alert('오류', '상품 ID를 찾지 못했습니다.'); return; }
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const url  = API_ENDPOINTS.PRODUCT_REVIEWS(productId || (await resolveProductIdFlow()));
      const body = { rating: Number(rating), content: content.trim() };
      console.log('[Review POST] url =', url);
      console.log('[Review POST] body =', JSON.stringify(body));

      const res = await authFetch(url, accessToken, setAccessToken, navigation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, useMock);

      if (res && typeof res.status === 'number') console.log('[Review POST] status =', res.status);
      const json = await toJsonLenient(res);
      console.log('[Review POST] response =', JSON.stringify(json, null, 2));

      Alert.alert('성공', '리뷰가 등록되었습니다.');
      navigation.goBack();
    } catch (e) {
      console.error('Review POST 실패:', e);
      Alert.alert('오류', '리뷰 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [productId, rating, content, accessToken, setAccessToken, navigation, useMock, toJsonLenient, resolveProductIdFlow]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* 제목 */}
          <Text style={styles.title}>리뷰 작성</Text>
          
          {/* 상품 정보 */}
          <View style={styles.infoBox}>
            {productImageUrl ? (
              <Image source={{ uri: productImageUrl }} style={styles.productImage} />
            ) : null}
            <Text style={styles.infoText}>상품명: {title || '(제목 없음)'}</Text>
          </View>

          {resolving && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>상품 ID 확인 중...</Text>
            </View>
          )}

          {/* 평점 입력 */}
          <Text style={styles.label}>평점 (1~5)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rating}
            onChangeText={setRating}
            placeholder="1~5"
            placeholderTextColor="#aaa"
          />

          {/* 내용 입력 */}
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="리뷰 내용을 입력해주세요"
            placeholderTextColor="#aaa"
            multiline
          />

          {/* 버튼 */}
          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>등록하기</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
      <CustomBottomBar navigation={navigation} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    minHeight: '100%',
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 80
  },
  title: {
    marginTop: 20,
    fontSize: 22, 
    fontWeight: '700',
    marginBottom: 16,
    color: '#222'
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center'
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover'
  },
  infoText: { color: '#444', fontSize: 14 },
  loadingRow: { flexDirection:'row', alignItems:'center', marginBottom: 12 },
  loadingText: { marginLeft:8, color:'#666' },
  label: { marginTop: 12, fontWeight: '600', color: '#333' },
  input: { 
    marginTop: 6, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    fontSize: 15,
    color: '#222'
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  button: { 
    backgroundColor: '#222', 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
