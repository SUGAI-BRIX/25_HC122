// 상품 판매 리스트
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useMockContext } from '../contexts/MockContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS, BASE_URL } from '../utils/config';
import useAuthGuard from '../utils/checkAuthAndRedirect';
import { Ionicons } from '@expo/vector-icons';
import CustomBottomBar from '../components/CustomBottomBar';
import { mockProducts } from '../mock/mockData';
import { AuthContext } from '../contexts/AuthContext';

const PLACEHOLDER_IMG =
  'https://via.placeholder.com/300x200.png?text=No+Image';

export default function ProductListScreen({ route, navigation }) {
  useAuthGuard(navigation);
  const { useMock } = useMockContext();
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const query = route.params?.query || '';
  const [products, setProducts] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  const parseQueryParams = (queryString) => {
    const params = new URLSearchParams(queryString);
    return {
      title: params.get('title') || '',
      fruitNames: params.getAll('fruitName'),
      grades: params.getAll('grade'),
    };
  };

  const buildImageSource = (raw) => {
    try {
      if (typeof raw === 'number') {
        // require() 결과
        return raw;
      }
      if (!raw || typeof raw !== 'string') {
        return { uri: PLACEHOLDER_IMG };
      }
      const s = raw.trim();

      // 서버가 다른 키로 줄 수도 있음: imageUrl, productImageUrl 등
      // 이 함수 호출 전 단계에서 이미 그 키를 raw로 넘겨오도록 매핑할 예정

      if (s.startsWith('http://') || s.startsWith('https://')) {
        return { uri: s };
      }
      if (s.startsWith('/')) {
        // 상대경로 → BASE_URL 붙이기 (예: http://IP:PORT + /images/xxx.jpg)
        // BASE_URL 마지막 슬래시 중복 방지
        const base = BASE_URL?.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        return { uri: `${base}${s}` };
      }
      // 그 외 문자열이면 일단 절대 URL이 아닌 것으로 보고 플레이스홀더
      return { uri: PLACEHOLDER_IMG };
    } catch (e) {
      console.warn('[buildImageSource] 실패:', e);
      return { uri: PLACEHOLDER_IMG };
    }
  };

  const fetchProducts = async () => {
    if (useMock) {
      const { title, fruitNames, grades } = parseQueryParams(query);
      const filtered = mockProducts.filter((item) => {
        const fruitMatch =
          fruitNames.length === 0 || fruitNames.includes(item.fruitName);
        const gradeMatch =
          grades.length === 0 || grades.includes(item.grade);
        const keywordMatch =
          title.trim() === '' || item.title.includes(title.trim());
        return fruitMatch && gradeMatch && keywordMatch;
      });
      setProducts(filtered);
      return;
    }

    try {
      const res = await authFetch(
        `${API_ENDPOINTS.SEARCH}${query ? `?${query}` : ''}`,
        accessToken,
        setAccessToken,
        navigation,
        { method: 'GET' },
        useMock
      );
      if (res.ok) {
        const payload = await res.json();
        const list = payload?.data ?? [];
        // 서버의 이미지 키명을 표준화: productImage 우선, 없으면 흔한 대안 키를 탐색
        const normalized = list.map((it) => {
          const imageRaw =
            it.productImage ??
            it.imageUrl ??
            it.productImageUrl ??
            it.thumbnail ??
            it.image ??
            ''; // 아무것도 없으면 빈 문자열
          return { ...it, _imageRaw: imageRaw };
        });

        // 디버깅용 로그
        if (normalized.length > 0) {
          console.log('[ProductList] 샘플 이미지 원본:', normalized[0]._imageRaw);
        }

        setProducts(normalized);
      } else {
        console.log('[ProductList] 응답 실패 상태:', res.status);
      }
    } catch (e) {
      console.error('상품 불러오기 실패:', e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query]);

  const renderItem = ({ item }) => {
    // useMock일 때도 require/URL 모두 안전 처리
    const raw = useMock ? item.productImage : item._imageRaw ?? item.productImage;
    const imageSource = buildImageSource(raw);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <Image source={imageSource} style={styles.image} />
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>
          {Number(item.price || 0).toLocaleString()}원
        </Text>
        <Text style={styles.stars}>⭐⭐⭐⭐☆</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 로고 */}
       <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* 삼선바 메뉴 버튼 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu((prev) => !prev)}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </TouchableOpacity>

      {/* 드롭다운 메뉴 - 내 판매글 목록 */}
      {showMenu && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyProductList')}
          >
            <Text style={styles.menuItemText}>내 판매글 목록</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 검색창 */}
      <TouchableOpacity
        style={styles.searchBox}
        onPress={() => navigation.navigate('ProductSearch')}
      >
        <Ionicons name="search" size={18} color="#999" />
        <Text style={styles.searchPlaceholder}>검색어를 입력하세요</Text>
      </TouchableOpacity>

      {/* 상품 목록 또는 빈 화면 안내 */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 결과 없음</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
        />
      )}

      {/* 하단 커스텀 탭 바 */}
      <CustomBottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 60,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  menu: {
    position: 'absolute',
    right: 16,
    top: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingVertical: 6,
    width: 160,
    zIndex: 10,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: 'center',
    width: '90%',
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
  },
  grid: {
    paddingBottom: 90,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 6,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stars: {
    fontSize: 12,
    color: '#f4c542',
  },
  logo: {
    marginTop: 30,
    width: 240,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 30,
  },
});
