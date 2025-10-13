// 메인 홈 화면
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { parseJwt } from '../utils/jwt';
import { useMockContext } from '../contexts/MockContext';
import CustomBottomBar from '../components/CustomBottomBar';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';
import { mockFruitChart } from '../mock/mockFruitChart';

export default function HomeScreen({ navigation }) {
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const { useMock } = useMockContext();
  const [remainingTime, setRemainingTime] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      Alert.alert('세션 만료', '다시 로그인 해주세요');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    if (useMock) {
      setRemainingTime(9999);
      return;
    }

    try {
      const decoded = parseJwt(accessToken);
      if (decoded && decoded.exp) {
        const interval = setInterval(() => {
          const now = Math.floor(Date.now() / 1000);
          const secondsLeft = decoded.exp - now;
          setRemainingTime(secondsLeft > 0 ? secondsLeft : 0);

          if (secondsLeft <= 0) {
            clearInterval(interval);
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    } catch (e) {
      console.error('JWT 파싱 오류:', e);
      Alert.alert('오류', '잘못된 토큰 형식입니다.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [accessToken, useMock]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await authFetch(
          API_ENDPOINTS.MY_INFO,
          accessToken,
          setAccessToken,
          navigation,
          { method: 'GET' },
          useMock
        );
        const userInfo = await res.json();
        setUserRole(userInfo.data?.role);
      } catch (e) {
        console.error('유저 정보 가져오기 실패:', e);
      }
    };

    if (accessToken) {
      fetchUserRole();
    }
  }, [accessToken, useMock]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.sectionTitle}>인기 과일 <Text style={styles.highlight}>TOP 5</Text></Text>

        <View style={styles.fruitRow}>
          <FruitItem name="딸기" icon={require('../assets/strawberry.png')} />
          <FruitItem name="바나나" icon={require('../assets/banana.png')} />
          <FruitItem name="사과" icon={require('../assets/apple.png')} />
          <FruitItem name="배" icon={require('../assets/pear.png')} />
          <FruitItem name="포도" icon={require('../assets/grape.png')} />
        </View>
        <Section
          title="과일 구매"
          subtitle="AI로 분류한 과일을 등급별로 구매해보세요!"
          buttonLabel="구매하러 가기"
          onPress={() => navigation.navigate('ProductSearch')}
          image={require('../assets/basket.png')}
        />
        {userRole === 'SELLER' && (
          <Section
            title="과일 판매"
            subtitle="내가 측정한 과일을 직접 판매해보세요!"
            buttonLabel="판매하기"
            onPress={() => navigation.navigate('ProductCreate')}
            image={require('../assets/sell.png')}
          />
        )}
        <Section
          title="시세 그래프"
          subtitle={
            <Text>
              <Text style={styles.red}>요즘 과일 시세</Text> 확인 해보세요!{"\n"}
              과일 시세를 확인하고 적절한 과일가를 확인해봐요!
            </Text>
          }
          buttonLabel="과일 시세 확인하러 가기"
          onPress={() => navigation.navigate('FruitPriceChart')}
          image={require('../assets/chart.png')}
        />
        <Section
          title="품질 측정"
          subtitle="AI로 직접 한번 과일 등급을 나눠봐요!"
          buttonLabel="과일 품질 측정하러 가기"
          onPress={() => navigation.navigate('MobileAi')}
          image={require('../assets/camera.png')}
        />
      </ScrollView>
      <CustomBottomBar navigation={navigation} />
    </View>
  );
}

function FruitItem({ name, icon }) {
  return (
    <View style={styles.fruitItem}>
      <Image source={icon} style={styles.fruitIcon} />
      <Text>{name}</Text>
    </View>
  );
}

function Section({ title, subtitle, buttonLabel, onPress, image }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {image && <Image source={image} style={styles.sectionImage} />}
        <View style={styles.sectionText}>
          {typeof subtitle === 'string' ? <Text>{subtitle}</Text> : subtitle}
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: '#FAFAFA',
  },
  logo: {
    marginTop: 30,
    width: 240,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  highlight: {
    color: '#FF6F61',
  },
  fruitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  fruitItem: {
    alignItems: 'center',
    marginBottom: 15,
    width: '18%',
  },
  fruitIcon: {
    width: 45,
    height: 45,
    marginBottom: 5,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 15,
  },
  sectionText: {
    flex: 1,
  },
  red: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
