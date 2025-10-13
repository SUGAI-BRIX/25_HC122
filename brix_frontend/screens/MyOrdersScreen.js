// screens/MyOrdersScreen.js
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useMockContext } from '../contexts/MockContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';
// 하단바 추가
import CustomBottomBar from '../components/CustomBottomBar';

const BOTTOM_BAR_HEIGHT = 72; // 하단바 높이(겹침 방지용 여백)

export default function MyOrdersScreen({ navigation }) {
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const ordersRef = useRef([]);

  // ---- BASE 유추 & URL 헬퍼
  const BASE = (() => {
    const cands = [API_ENDPOINTS?.MY_ORDERS, API_ENDPOINTS?.USER_ME].filter(Boolean);
    for (const u of cands) {
      if (typeof u === 'string' && u.startsWith('http')) {
        for (const cut of ['/orders/my', '/users/me']) {
          const i = u.indexOf(cut);
          if (i > 0) return u.slice(0, i);
        }
      }
    }
    return '';
  })();

  const URLS = {
    myOrders: API_ENDPOINTS?.MY_ORDERS ?? `${BASE}/orders/my`,
  };

  // ---- 유틸
  const toJsonLenient = useCallback(async (resLike) => {
    if (!resLike) return null;
    const isFetch = typeof resLike === 'object' && 'status' in resLike && (resLike.text || resLike.json);
    if (isFetch) {
      try {
        const txt = typeof resLike.text === 'function' ? await resLike.text() : null;
        if (!txt || txt.trim() === '') return null;
        try { return JSON.parse(txt); } catch { return null; }
      } catch { return null; }
    }
    return resLike;
  }, []);

  const extractArrayPayload = useCallback((root) => {
    const raw = root?.data ?? root;
    if (Array.isArray(raw?.data?.content)) return raw.data.content; // page
    if (Array.isArray(raw?.data?.data))    return raw.data.data;    // data.data
    if (Array.isArray(raw?.data))          return raw.data;         // data[]
    if (Array.isArray(raw))                return raw;              // root[]
    return [];
  }, []);

  const fmtCurrency = (n) => {
    const num = Number(n ?? 0);
    return num.toLocaleString('ko-KR') + '원';
  };
  const fmtDate = (s) => {
    if (!s) return '-';
    const str = String(s);
    return str.length > 10 ? str.slice(0, 10) : str;
  };

  const normalizeOrder = useCallback((raw) => {
    const orderId  = raw?.id ?? raw?.orderId ?? null;
    const title    = raw?.productTitle ?? raw?.product?.title ?? raw?.title ?? '상품 제목 없음';

    const unitPrice =
      raw?.unitPrice ?? raw?.price ?? raw?.product?.price ?? raw?.item?.price ?? null;
    const quantity =
      raw?.quantity ?? raw?.qty ?? raw?.count ?? raw?.item?.quantity ?? null;
    const totalPrice =
      raw?.totalPrice ?? raw?.totalAmount ?? raw?.total ?? (unitPrice && quantity ? Number(unitPrice) * Number(quantity) : null);

    const orderDate = raw?.createdAt ?? raw?.orderDate ?? raw?.orderedAt ?? null;
    const expected  = raw?.estimatedDeliveryDate ?? raw?.expectedDeliveryDate ?? raw?.deliveryDate ?? null;

    const addrObj =
      raw?.shippingAddress ?? raw?.address ?? raw?.deliveryAddress ?? raw?.receiver ?? null;
    const address =
      typeof addrObj === 'string'
        ? addrObj
        : [addrObj?.city, addrObj?.district, addrObj?.detail, addrObj?.address1, addrObj?.address2]
            .filter(Boolean).join(' ') || null;

    const status = String(raw?.status ?? 'PENDING');

    return {
      orderId, title, unitPrice, quantity, totalPrice,
      orderDate, expected, address, status
    };
  }, []);

  // 데이터 로드
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[MyOrders] GET', URLS.myOrders);
      const res  = await authFetch(URLS.myOrders, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
      const root = await toJsonLenient(res);
      const list = extractArrayPayload(root).map(normalizeOrder);

      console.log(`[MyOrders] parsed: ${list.length}`);
      ordersRef.current = list;
      setOrders(list);
    } catch (e) {
      console.error('[MyOrders] load failed:', e);
      Alert.alert('오류', '주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [URLS.myOrders, accessToken, setAccessToken, navigation, useMock, toJsonLenient, extractArrayPayload, normalizeOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ---- 렌더
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      <Text style={styles.meta}>가격: {item.unitPrice != null ? fmtCurrency(item.unitPrice) : '-'}</Text>
      <Text style={styles.meta}>수량: {item.quantity != null ? `${item.quantity}개` : '-'}</Text>
      <Text style={styles.meta}>총액: {item.totalPrice != null ? fmtCurrency(item.totalPrice) : '-'}</Text>

      <Text style={styles.meta}>주문일: {fmtDate(item.orderDate)}</Text>
      <Text style={styles.meta}>예상 배송일: {fmtDate(item.expected)}</Text>
      <Text style={styles.meta}>배송지: {item.address || '-'}</Text>
      <Text style={styles.meta}>상태: {item.status}</Text>

      <TouchableOpacity
        style={styles.reviewBtn}
        onPress={() => navigation.navigate('ReviewWrite', { orderId: item.orderId, title: item.title })}
      >
        <Text style={styles.reviewText}>리뷰 쓰기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 내가 구매한 품목</Text>

      {loading ? (
        <View style={styles.centerWithPadding}>
          <ActivityIndicator size="large" color="#d9534f" />
          <Text style={{ marginTop: 8, color: '#666' }}>주문을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.orderId ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 + BOTTOM_BAR_HEIGHT }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#999' }}>주문 내역이 없습니다.</Text>
            </View>
          }
        />
      )}

      {/* 하단 여백 없이도 겹치지 않게 contentContainerStyle에 paddingBottom을 줬음 */}
      <CustomBottomBar navigation={navigation} active="orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: '800', marginTop: 12, marginHorizontal: 16, marginBottom: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#222', marginBottom: 8 },
  meta: { color: '#555', marginTop: 2 },

  reviewBtn: {
    marginTop: 12,
    backgroundColor: '#ef5350',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  reviewText: { color: '#fff', fontWeight: '800' },

  empty: { padding: 32, alignItems: 'center' },

  centerWithPadding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: BOTTOM_BAR_HEIGHT, // 로딩 화면도 하단바에 안가리게
  },
});
