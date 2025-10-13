// 상품 검색
import React, { useState } from 'react';
import CheckBox from 'expo-checkbox';
import { useMockContext } from '../contexts/MockContext';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

// 한글 라벨 + 영문 코드 매핑된 과일 옵션
const fruitOptions = [
  { label: '딸기', value: 'strawberry' },
  { label: '바나나', value: 'banana' },
  { label: '사과', value: 'apple' },
  { label: '배', value: 'pear' },
  { label: '복숭아', value: 'peach' },
  { label: '포도', value: 'grape' },
];

// 등급은 그대로 사용
const gradeOptions = ['S', 'A', 'B'];

export default function ProductSearchScreen({ navigation }) {
  const { useMock } = useMockContext();

  const [selectedFruits, setSelectedFruits] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [keyword, setKeyword] = useState('');

  // 선택 토글 함수 (공통)
  const toggleSelection = (value, selected, setSelected) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(item => item !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  // 검색 버튼 누르면 ProductListScreen에 query 넘기기
  const handleSearch = () => {
    const params = [];

    if (keyword) {
      params.push(`title=${encodeURIComponent(keyword)}`);
    }

    if (selectedFruits.length > 0) {
      selectedFruits.forEach(fruit => {
        params.push(`fruitName=${encodeURIComponent(fruit)}`);
      });
    }

    if (selectedGrades.length > 0) {
      selectedGrades.forEach(grade => {
        params.push(`grade=${encodeURIComponent(grade)}`);
      });
    }

    const query = params.join('&');

    navigation.navigate('ProductList', {
      query, // ProductListScreen으로 쿼리 넘김
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛒 구매하러 가기</Text>

      {/* 키워드 입력 */}
      <TextInput
        style={styles.input}
        placeholder="상품 키워드 검색"
        value={keyword}
        onChangeText={setKeyword}
      />

      {/* 과일 종류 체크박스 */}
      <Text style={styles.subtitle}>과일 종류</Text>
      {fruitOptions.map(fruit => (
        <View key={fruit.value} style={styles.checkboxContainer}>
          <CheckBox
            value={selectedFruits.includes(fruit.value)}
            onValueChange={() => toggleSelection(fruit.value, selectedFruits, setSelectedFruits)}
          />
          <Text style={styles.checkboxLabel}>{fruit.label}</Text>
        </View>
      ))}

      {/* 등급 체크박스 */}
      <Text style={styles.subtitle}>등급</Text>
      {gradeOptions.map(grade => (
        <View key={grade} style={styles.checkboxContainer}>
          <CheckBox
            value={selectedGrades.includes(grade)}
            onValueChange={() => toggleSelection(grade, selectedGrades, setSelectedGrades)}
          />
          <Text style={styles.checkboxLabel}>{grade}</Text>
        </View>
      ))}

      {/* 검색 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>검색</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, marginTop: 16, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
