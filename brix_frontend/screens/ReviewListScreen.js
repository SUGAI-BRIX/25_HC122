//리뷰 목록
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useMockContext } from '../contexts/MockContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';

export default function ReviewListScreen({ route, navigation }) {
  const { productId, title } = route.params || {};
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const extractArray = (root) => {
    const r = root?.data ?? root;
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.data)) return r.data;
    if (Array.isArray(r?.content)) return r.content;
    return [];
  };

  const fetchReviews = useCallback(async () => {
    if (!productId) { setLoading(false); return; }
    try {
      if (!refreshing) setLoading(true);
      const url = API_ENDPOINTS.PRODUCT_REVIEWS(productId);
      console.log('[ReviewList] GET', url);
      const res = await authFetch(url, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
      const json = await toJsonLenient(res);
      const list = extractArray(json);
      setReviews(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('ReviewList fetch fail:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId, accessToken, setAccessToken, navigation, useMock, toJsonLenient, refreshing]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const onRefresh = () => { setRefreshing(true); fetchReviews(); };

  const renderStars = (n) => '★★★★★☆☆☆☆☆'.slice(5 - Math.min(5, Math.max(0, Number(n)||0)), 10 - Math.min(5, Math.max(0, Number(n)||0)));

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((s, r) => s + Number(r.rating || r.score || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const renderItem = ({ item }) => {
    const nickname = item.nickname ?? item.userNickname ?? item.author ?? '익명';
    const rating = item.rating ?? item.score ?? 0;
    const content = item.content ?? item.comment ?? '';
    const created = (item.createdAt || item.created || item.date || '').toString().slice(0, 10);
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.nick}>{nickname}</Text>
          <Text style={styles.stars}>{renderStars(rating)} <Text style={styles.rate}>{rating}</Text></Text>
        </View>
        <Text style={styles.content}>{content}</Text>
        <Text style={styles.date}>{created}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>⭐ {title || '상품'} 리뷰</Text>
      <View style={styles.summary}>
        <Text style={styles.sumText}>
          {avgRating ? `평균 ${avgRating}점 · ` : ''}{reviews.length}개 리뷰
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReviewWrite', { productId, title })}
          style={styles.writeBtn}
        >
          <Text style={styles.writeText}>리뷰 작성</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item, idx) => String(item.id ?? item.reviewId ?? idx)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={{ color: '#777' }}>아직 등록된 리뷰가 없습니다.</Text></View>}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { marginTop: 40, fontSize: 18, fontWeight: '800', margin: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4 },
  sumText: { color: '#444', fontWeight: '600' },
  writeBtn: { backgroundColor: '#ef5350', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  writeText: { color: '#fff', fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 32, alignItems: 'center' },
  card: { backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nick: { fontWeight: '800', color: '#222' },
  stars: { fontFamily: 'System', color: '#111' },
  rate: { color: '#ef5350', fontWeight: '800' },
  content: { marginTop: 6, color: '#333', lineHeight: 20 },
  date: { marginTop: 6, color: '#888', fontSize: 12 },
});
