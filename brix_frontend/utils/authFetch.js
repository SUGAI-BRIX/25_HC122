import { Alert } from 'react-native';
import { API_ENDPOINTS } from './config';

export async function authFetch(
  url, // 요청 URL
  accessToken, // 현재 accessToken
  setAccessToken, // 토큰 갱신 함수
  navigation, // navigation 객체
  options = {}, // fetch 옵션 (method, body, headers 등)
  useMock = false // mock 여부
) {
  const fetchWithToken = async (token) => {
    const isFormData = options.body instanceof FormData;  // FormData 여부 확인

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    // FormData일 경우 Content-Type을 지정하지 않음 (fetch가 자동으로 설정)
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';  // JSON 전송일 때만 Content-Type 설정
    }

    return fetch(url, {
      ...options,
      headers: headers,
    });
  };

  // ✅ MOCK 응답 처리
  if (useMock) {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
  data: {
    username: 'mockUser',
    nickname: '홍길동',
    email: 'mock@example.com',
    role: 'SELLER',
  },
}),
    };
    return mockResponse;
  }

  // ✅ 1차 요청
  let response;
  try {
    response = await fetchWithToken(accessToken);
  } catch (networkError) {
    console.error('❌ 네트워크 오류:', networkError);
    throw networkError;
  }

  // ✅ 401이면 토큰 재발급 시도
  if (response.status === 401) {
    console.log('🔄 토큰 만료 - 재발급 시도');
    try {
      const refreshRes = await fetch(API_ENDPOINTS.REISSUE, {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
      });

      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.accessToken) {
        setAccessToken(refreshData.accessToken);
        response = await fetchWithToken(refreshData.accessToken);
      } else {
        Alert.alert('세션 만료', '다시 로그인 해주세요');
        setAccessToken(null);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        throw new Error('RefreshToken expired');
      }
    } catch (e) {
      console.error('❌ 토큰 재발급 실패:', e);
      throw e;
    }
  }

  return response;
}
