// accessToken이 없으면 로그인 페이지로 리다이렉트하게 해줌
import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function useAuthGuard(navigation) {
  const { accessToken } = useContext(AuthContext);

  useEffect(() => { //	컴포넌트가 "마운트"되거나 특정 값이 바뀔 때 어떤 행동을 하게 만드는 함수
    if (!accessToken) {
      console.warn('⛔ accessToken 없음 - 로그인 페이지로 이동');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [accessToken]);
}
