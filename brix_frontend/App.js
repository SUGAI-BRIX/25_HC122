import React, { useEffect } from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './contexts/AuthContext';
import { MockProvider } from './contexts/MockContext';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import MyPageScreen from './screens/MyPageScreen';
import FindPasswordScreen from './screens/FindPasswordScreen';
import ProductSearchScreen from './screens/ProductSearchScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProductCreateScreen from './screens/ProductCreateScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import MyProductListScreen from './screens/MyProductListScreen';
import FruitPriceChartScreen from './screens/FruitPriceChartScreen';
import ReviewWriteScreen from './screens/ReviewWriteScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import MobileAiScreen from './screens/MobileAiScreen';
import ReviewListScreen from './screens/ReviewListScreen';
import * as NavigationBar from 'expo-navigation-bar';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");  // ✅ 내비게이션 바 숨기기
    NavigationBar.setBehaviorAsync("overlay-swipe"); // ✅ 스와이프 시 나타나게
  }, []);

  return (
    <MockProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="FindPassword" component={FindPasswordScreen} />
            <Stack.Screen name="ProductSearch" component={ProductSearchScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ProductCreate" component={ProductCreateScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="MyProductList" component={MyProductListScreen} />
            <Stack.Screen name="MobileAi" component={MobileAiScreen} />
            <Stack.Screen name="FruitPriceChart" component={FruitPriceChartScreen} />
            <Stack.Screen name="ReviewWrite" component={ReviewWriteScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen name="ReviewList" component={ReviewListScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </MockProvider>
  );
}
