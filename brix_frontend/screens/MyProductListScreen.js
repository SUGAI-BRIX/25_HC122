//내 상품 리스트
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { authFetch } from '../utils/authFetch';
import { API_ENDPOINTS } from '../utils/config';
import { Ionicons } from '@expo/vector-icons';

export default function MyProductListScreen({ navigation }) {
  const { accessToken, setAccessToken } = useContext(AuthContext);
  const [products, setProducts] = useState([]);

  const fetchMyProducts = async () => {
    try {
      const res = await authFetch(
        API_ENDPOINTS.MY_PRODUCTS,
        accessToken,
        setAccessToken,
        navigation,
        { method: 'GET' }
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data);
      }
    } catch (e) {
      console.error('내 판매글 불러오기 실패:', e);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleEdit = (productId) => {
    navigation.navigate('ProductEdit', { productId });
  };

  const handleDelete = async (productId) => {
    try {
      const res = await authFetch(
        `${API_ENDPOINTS.MY_PRODUCTS}/${productId}`,
        accessToken,
        setAccessToken,
        navigation,
        { method: 'DELETE' }
      );
      if (res.ok) {
        alert('상품이 삭제되었습니다.');
        fetchMyProducts();  // 삭제 후 리스트 갱신
      }
    } catch (e) {
      console.error('상품 삭제 실패:', e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.price}>{item.price.toLocaleString()}원</Text>
      <Text>등급: {item.grade}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => handleEdit(item.id)} style={styles.editButton}>
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.buttonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.buttonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  card: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  titleText: { fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, color: 'red', marginVertical: 4 },
  buttonContainer: { flexDirection: 'row', marginTop: 10 },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', marginLeft: 5 },
});
