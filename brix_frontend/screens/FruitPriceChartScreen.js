//시세 그래프
import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View, Text, Dimensions, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Image
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { mockFruitChart } from '../mock/mockFruitChart';
import { useMockContext } from '../contexts/MockContext';
import { AuthContext } from '../contexts/AuthContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ACCENT = '#FF6F61';
const TOP_PAD = Math.round(screenHeight * 0.04);

// 등급 버튼
const GRADES = [
  { quality: 4, label: '특' },
  { quality: 1, label: '하' },
];

// 날짜 포맷
const fmtDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 다양한 입력 → YYYY-MM-DD
const normalizeDateString = (val) => {
  if (val == null) return null;
  if (typeof val === 'number') {
    const ms = val > 1e12 ? val : val * 1000;
    const d = new Date(ms);
    return isNaN(d) ? null : fmtDate(d);
  }
  const s = String(val).trim();
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) return s.slice(0,10).replace(/\//g, '-');
  const d = new Date(s);
  if (!isNaN(d)) return fmtDate(d);
  return null;
};

// 서버 응답 → {date, price} 정규화 + 정렬
const normalizeSeries = (rows = []) =>
  rows.map((r) => {
      const dateRaw = r.date ?? r.baseDate ?? r.tradeDate ?? r.createdAt ?? r.regDate ?? r.day ?? r.dt;
      const date = normalizeDateString(dateRaw);
      const priceRaw = r.price ?? r.avgPrice ?? r.averagePrice ?? r.avg ?? r.avg_total_price ?? r.avgPriceWon ?? r.meanPrice;
      const price = Number(priceRaw);
      if (!date || !isFinite(price)) return null;
      return { date, price };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

// 범위 체크
const inRange = (d, start, end) => d >= start && d <= end;

// API origin → 이미지 상대경로 보정용, products/{id} 상세 호출용
const API_ORIGIN = (() => {
  try { return new URL(API_ENDPOINTS.FRUITS_GRAPH).origin; } catch { return ''; }
})();
const PRODUCTS_BASE = API_ORIGIN ? `${API_ORIGIN}/products` : '/products';

// 인기글 이미지 URL 해석 (productImageUrl 추가 + snake_case 대비)
const resolveImageUrl = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  let cand =
    obj.productImageUrl ?? obj.imageUrl ?? obj.productImage ?? obj.image ?? obj.imageURL ??
    obj.thumbnail ?? obj.thumbnailUrl ?? obj.thumbUrl ??
    obj.mainImageUrl ?? obj.mainImage ??
    obj.product_image_url ?? obj.image_url ?? null;

  if (!cand && Array.isArray(obj.images) && obj.images.length) {
    cand = obj.images[0]?.url ?? obj.images[0];
  }
  if (!cand && Array.isArray(obj.photos) && obj.photos.length) {
    cand = obj.photos[0]?.url ?? obj.photos[0];
  }
  if (!cand && obj.product) {
    cand = resolveImageUrl(obj.product);
  }

  if (!cand) return null;
  const s = String(cand).trim();

  // 절대 URL
  if (/^https?:\/\//i.test(s)) return s;

  // 상대 URL
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return API_ORIGIN ? `${API_ORIGIN}/${s}` : s;
};

// 상세 API로 이미지 보강(Top-N만이라 부담 적음)
async function hydratePopularImages(list, { accessToken, setAccessToken, navigation }) {
  return Promise.all(
    list.map(async (p) => {
      const direct = resolveImageUrl(p);
      if (direct) return { ...p, _imageUrl: direct };

      const id = p.id ?? p.productId ?? p?.product?.id;
      if (!id) return { ...p, _imageUrl: null };

      try {
        const detailUrl = `${PRODUCTS_BASE}/${id}`;
        console.log('[Detail] GET =>', detailUrl);
        const res = await authFetch(detailUrl, accessToken, setAccessToken, navigation, { method: 'GET' });
        const json = await res.json();
        console.log('[Detail] raw json:', JSON.stringify(json));
        const payload = json?.data ?? json;
        const viaDetail = resolveImageUrl(payload) ?? resolveImageUrl(payload?.product);
        return { ...p, _imageUrl: viaDetail ?? null };
      } catch {
        return { ...p, _imageUrl: null };
      }
    })
  );
}

export default function FruitPriceChartScreen({ navigation }) {
  const [selectedQuality, setSelectedQuality] = useState(4);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [popular, setPopular] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const { useMock } = useMockContext();
  const { accessToken, setAccessToken } = useContext(AuthContext);

  // 오늘 기준 최근 6개월 요청 범위
  const { start, end } = useMemo(() => {
    const e = new Date();
    const s = new Date();
    s.setMonth(s.getMonth() - 6);
    return { start: fmtDate(s), end: fmtDate(e) };
  }, []);

  // 그래프 데이터
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (useMock) {
          const raw = mockFruitChart[selectedQuality] || [];
          const norm = normalizeSeries(raw);
          const s = new Date(start), e = new Date(end);
          const ranged = norm.filter(r => inRange(new Date(r.date), s, e));
          setChartData(ranged);
        } else {
          const itemCode = 226;
          const url = `${API_ENDPOINTS.FRUITS_GRAPH}?itemCode=${itemCode}&quality=${selectedQuality}&start=${start}&end=${end}`;
          const res = await authFetch(url, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
          const json = await res.json();
          const norm = normalizeSeries(Array.isArray(json?.data) ? json.data : []);
          const s = new Date(start), e = new Date(end);
          const ranged = norm.filter(r => inRange(new Date(r.date), s, e));
          console.log('[FruitPrice] req:', url);
          console.log('[FruitPrice] resp range:', norm[0]?.date, '→', norm.at(-1)?.date, '(raw n=', norm.length, ')');
          console.log('[FruitPrice] after filter:', ranged[0]?.date, '→', ranged.at(-1)?.date, '(n=', ranged.length, ')');
          setChartData(ranged);
        }
      } catch (e) {
        console.error('시세 데이터 가져오기 실패:', e);
        setErr('시세 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [selectedQuality, useMock, start, end]);

  // 인기 판매글 (이미지 해석 + 상세 보강)
  useEffect(() => {
    const fetchPopular = async () => {
      setPopularLoading(true);
      try {
        if (useMock) {
          setPopular([]);
        } else {
          const res = await authFetch(API_ENDPOINTS.PRODUCTS_POPULAR, accessToken, setAccessToken, navigation, { method: 'GET' }, useMock);
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : [];

          // 1차: DTO에서 직접 해석
          const direct = list.map((p) => {
            const url = resolveImageUrl(p);
            if (!url) {
              console.log('[Popular] no image in DTO keys =', JSON.stringify(Object.keys(p || {})));
            }
            return { ...p, _imageUrl: url || null };
          });

          // 2차: 여전히 없는 항목만 상세로 보강
          const needHydrate = direct.some((p) => !p._imageUrl);
          const hydrated = needHydrate
            ? await hydratePopularImages(direct, { accessToken, setAccessToken, navigation })
            : direct;

          if (hydrated[0]) {
            console.log('[Popular] sample item:', JSON.stringify(hydrated[0], null, 2));
            console.log('[Popular] resolved image =', hydrated[0]._imageUrl);
          }
          setPopular(hydrated);
        }
      } catch (e) {
        console.error('인기 판매글 가져오기 실패:', e);
        setPopular([]);
      } finally {
        setPopularLoading(false);
      }
    };
    fetchPopular();
  }, [useMock]);

  // 라벨/값
  const labels = chartData.map(d => d.date.slice(5));
  const values = chartData.map(d => d.price);

  // 실제 데이터 범위(표시용)
  const dataStart = chartData[0]?.date ?? start;
  const dataEnd = chartData.at(-1)?.date ?? end;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent} showsVerticalScrollIndicator>
      {/* 헤더 (경고 배지 제거) */}
      <View style={styles.header}>
        <Text style={styles.title}>📈 딸기 시세</Text>
        <Text style={styles.subTitle}>{dataStart} ~ {dataEnd}</Text>
      </View>

      {/* 등급 토글 */}
      <View style={styles.gradeToggle}>
        {GRADES.map(g => {
          const active = selectedQuality === g.quality;
          return (
            <TouchableOpacity
              key={g.quality}
              onPress={() => setSelectedQuality(g.quality)}
              style={[styles.gradeBtn, active && styles.gradeBtnActive]}
              activeOpacity={0.9}
            >
              <Text style={[styles.gradeBtnText, active && styles.gradeBtnTextActive]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 차트 */}
      {loading ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 24 }} />
      ) : err ? (
        <View style={styles.emptyWrap}><Text style={styles.emptyText}>{err}</Text></View>
      ) : values.length === 0 ? (
        <View style={styles.emptyWrap}><Text style={styles.emptyText}>데이터가 없습니다.</Text></View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>등급: {selectedQuality === 4 ? '특' : '하'}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>개수: {values.length}건</Text>
              <Text style={styles.summaryItem}>
                평균가: {Math.round(values.reduce((a, b) => a + b, 0) / values.length).toLocaleString()}원
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{ labels, datasets: [{ data: values }] }}
              width={Math.max(labels.length * 50, screenWidth)}
              height={260}
              yAxisSuffix="원"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 111, 97, ${opacity})`,
                labelColor: () => '#4f4f4f',
                style: { borderRadius: 16 },
                propsForDots: { r: '3.5', strokeWidth: '2', stroke: ACCENT },
              }}
              style={styles.chart}
              bezier
            />
          </ScrollView>
        </>
      )}

      {/* 인기 판매글 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>인기 판매글</Text>
        <Text style={styles.sectionSub}>평점 4.0↑ & 리뷰 많은 순</Text>
      </View>

      {popularLoading ? (
        <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 8 }} />
      ) : popular.length === 0 ? (
        <View style={styles.emptyWrap}><Text style={styles.emptyText}>인기 판매글이 없습니다.</Text></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          {popular.map((p, idx) => {
            const id = p.id ?? p.productId ?? p?.product?.id ?? String(idx);
            const title = p.title ?? p.productTitle ?? p?.product?.title ?? '제목 없음';
            const imgUrl = p._imageUrl ?? resolveImageUrl(p); // 최종 이미지
            const grade = p.grade ?? p?.product?.grade ?? '-';
            const price = p.price ?? p.minTotalPrice ?? p.avgPrice ?? p?.product?.price;
            const rating = p.avgRating ?? p.rating ?? p.averageRating ?? 0;
            const reviews = p.reviewCount ?? p.reviews ?? p.totalReviews ?? 0;

            return (
              <TouchableOpacity key={String(id)} style={styles.card} onPress={() => navigation.navigate('ProductDetail', { productId: id })}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.cardImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                    <Text style={{ color: '#999' }}>이미지 없음</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.cardMeta}>등급 {grade} · ⭐ {Number(rating).toFixed(1)} ({reviews})</Text>
                  {price ? <Text style={styles.cardPrice}>{Number(price).toLocaleString()}원</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  containerContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: TOP_PAD },

  header: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', color: '#222' },
  subTitle: { marginTop: 4, fontSize: 12, color: '#777' },

  gradeToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, marginVertical: 14 },
  gradeBtn: {
    flex: 1, minHeight: 50, paddingVertical: 14,
    borderRadius: 999, backgroundColor: '#eee',
    alignItems: 'center', justifyContent: 'center',
  },
  gradeBtnActive: { backgroundColor: ACCENT },
  gradeBtnText: { color: '#333', fontWeight: '700', fontSize: 16 },
  gradeBtnTextActive: { color: '#fff' },

  summaryCard: { backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  summaryRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { color: '#444' },

  chart: { marginVertical: 10, borderRadius: 16, alignSelf: 'flex-start' },

  sectionHeader: { marginTop: 18, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  sectionSub: { fontSize: 12, color: '#888' },

  card: { width: 180, marginRight: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  cardImg: { width: '100%', height: 110 },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f3f3' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#666' },
  cardPrice: { marginTop: 6, fontSize: 14, fontWeight: '800', color: ACCENT },

  emptyWrap: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { color: '#999' },
});
2580