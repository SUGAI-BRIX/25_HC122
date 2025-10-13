// 상품 상세 정보
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { API_ENDPOINTS, BASE_URL } from '../utils/config';
import { mockProducts } from '../mock/mockData';
import { useMockContext } from '../contexts/MockContext';
import CustomBottomBar from '../components/CustomBottomBar';
import useAuthGuard from '../utils/checkAuthAndRedirect';
import { AuthContext } from '../contexts/AuthContext';
import { authFetch } from '../utils/authFetch';

export default function ProductDetailScreen({ route, navigation }) {
  useAuthGuard(navigation);

  const { productId } = route.params ?? {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const { useMock } = useMockContext();
  const { accessToken, setAccessToken } = useContext(AuthContext);

  const resolveEndpoint = (ep, ...args) => (typeof ep === 'function' ? ep(...args) : ep);

  //Response면 json으로, 이미 객체면 그대로
  const toJsonIfNeeded = async (root) => {
    if (root && typeof root.json === 'function' && ('ok' in root || 'status' in root)) {
      try {
        const j = await root.json();
        return j;
      } catch (e) {
        console.warn('[Detail] json parse fail:', e);
        return null;
      }
    }
    return root ?? null;
  };

  //상대경로 이미지면 BASE_URL 붙여 정규화
  const normalizeUrl = (u) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    const base = (typeof BASE_URL === 'string' ? BASE_URL : '').replace(/\/+$/, '');
    const path = String(u).startsWith('/') ? u : `/${u}`;
    return base ? `${base}${path}` : u;
  };

  const handleOrder = async () => {
    try {
      const createOrderUrl = resolveEndpoint(API_ENDPOINTS.CREATE_ORDER);
      const root = await authFetch(
        createOrderUrl,
        accessToken,
        setAccessToken,
        navigation,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            deliveryAddress: '서울특별시 강남구 어딘가 123-4',
          }),
        },
        useMock
      );

      const json = await toJsonIfNeeded(root);
      const status = json?.status ?? root?.status ?? 0;
      const message = json?.message;

      if (status === 200) {
        Alert.alert('주문 완료', '구매가 성공적으로 완료되었습니다!');
      } else {
        Alert.alert('주문 실패', message ?? '다시 시도해주세요.');
      }
    } catch (e) {
      console.error('주문 중 오류:', e);
      Alert.alert('에러', '예상치 못한 오류가 발생했습니다.');
    }
  };

  const fetchProductDetail = async () => {
    if (!productId) {
      Alert.alert('오류', '잘못된 상품 ID입니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (useMock) {
        const found = mockProducts.find((p) => String(p.id) === String(productId));
        if (!found) throw new Error('Mock 데이터에서 해당 상품을 찾을 수 없습니다.');
        setProduct({
          id: found.id,
          title: found.title,
          sellerName: found.sellerName ?? 'mock판매자',
          fruitName: found.fruitName ?? '',
          grade: found.grade ?? '',
          price: found.price ?? found.avgTotalPrice ?? null,
          quantity: found.quantity ?? 1,
          expectedDeliveryDate: found.expectedDeliveryDate ?? '2025-07-01',
          description: found.description ?? 'mock 설명입니다.',
          gradeTokenMap: found.gradeTokenMap ?? { S: 3, A: 2, B: 1 },
          productImageUrl: normalizeUrl(
            found.productImageUrl || found.productImage || found.imageUrl || null
          ),
        });
        return;
      }

      const detailUrlBase = resolveEndpoint(API_ENDPOINTS.PRODUCT_DETAIL, productId);
      const detailUrl =
        typeof API_ENDPOINTS.PRODUCT_DETAIL === 'function'
          ? detailUrlBase
          : `${String(detailUrlBase).replace(/\/+$/, '')}/${productId}`;

      console.log('[Detail] GET =>', detailUrl);
      const root = await authFetch(
        detailUrl,
        accessToken,
        setAccessToken,
        navigation,
        { method: 'GET' },
        useMock
      );

      const json = await toJsonIfNeeded(root);
      console.log('[Detail] raw json:', json);

      // 서버 규약: { status, message, data } 또는 바로 {...}
      let payload = json?.data ?? json;
      if (Array.isArray(payload)) payload = payload[0];

      if (!payload || typeof payload !== 'object') {
        throw new Error('상품 상세 응답이 비어있거나 형식이 올바르지 않습니다.');
      }

      // 안전 매핑: 다양한 DTO 필드명 대응
      const normalized = {
        id: payload.id ?? payload.productId,
        title: payload.title ?? payload.name ?? '',
        sellerName: payload.sellerNickname ?? payload.sellerName ?? payload.seller ?? '판매자',
        fruitName: payload.fruitType?.name ?? payload.fruitName ?? payload.fruit ?? '',
        grade: payload.grade ?? payload.quality ?? payload.rank ?? '',
        price: (() => {
          const cands = [
            payload.price,
            payload.avgTotalPrice,
            payload.averagePrice,
            payload.totalPrice,
            payload.minTotalPrice,
          ];
          return cands.find((v) => v != null) ?? null;
        })(),
        quantity: payload.quantity ?? payload.stock ?? payload.bundleCount ?? 1,
        expectedDeliveryDate: payload.expectedDeliveryDate ?? payload.eta ?? '',
        description: payload.description ?? payload.content ?? '',
        gradeTokenMap: payload.gradeTokenMap ?? payload.gradeTokenCounts ?? {},
        productImageUrl: normalizeUrl(
          payload.productImageUrl ||
            payload.imageUrl ||
            payload.image ||
            payload.productImage ||
            null
        ),
      };

      setProduct(normalized);
    } catch (e) {
      console.error('상품 상세 불러오기 실패:', e);
      Alert.alert('오류', '상품 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [productId, accessToken]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4caf50" />;
  }

  if (!product) {
    return <Text style={{ padding: 20 }}>상품 정보를 불러오지 못했습니다.</Text>;
  }

  const imageSource = product.productImageUrl
    ? { uri: product.productImageUrl }
    : require('../assets/apple.png');

  const hasTokens = product.gradeTokenMap && Object.keys(product.gradeTokenMap).length > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={imageSource} style={styles.image} />

        <Text style={styles.title}>{product.title}</Text>

        <View style={styles.card}>
          <DetailItem label="판매자" value={product.sellerName} />
          <DetailItem label="과일 이름" value={product.fruitName} />
          <DetailItem label="등급" value={product.grade} />
          <DetailItem label="가격" value={product.price != null ? `${product.price}원` : '-'} />
          <DetailItem label="수량" value={`${product.quantity}개`} />
          <DetailItem label="배송 예정일" value={product.expectedDeliveryDate || '-'} />
        </View>

        {product.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>상품 설명</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        ) : null}

        {hasTokens && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>등급별 토큰</Text>
            <View style={styles.tokenList}>
              {Object.entries(product.gradeTokenMap).map(([grade, count]) => (
                <View key={grade} style={styles.tokenItem}>
                  <Text style={styles.tokenGrade}>{grade}</Text>
                  <Text style={styles.tokenCount}>{count}개</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.buyButton} onPress={handleOrder}>
          <Text style={styles.buyButtonText}>🛒 구매하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: '#455A64', marginBottom: 12 }]}
          onPress={() => navigation.navigate('ReviewList', { productId: product.id, title: product.title })}
        >
          <Text style={styles.buyButtonText}>⭐ 리뷰 보기</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomBottomBar navigation={navigation} />
    </View>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value ?? '')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  detailItem: { marginBottom: 10 },
  label: { fontSize: 14, color: '#777', marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '600', color: '#222' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#111' },
  description: { fontSize: 14, color: '#444', lineHeight: 20 },

  tokenList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tokenItem: {
    backgroundColor: '#FFEFEA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenGrade: { fontWeight: 'bold', marginRight: 5, color: '#B05648' },
  tokenCount: { color: '#B05648' },

  buyButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  buyButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
