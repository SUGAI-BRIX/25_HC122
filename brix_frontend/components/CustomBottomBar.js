// 하단바
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function CustomBottomBar({ navigation }) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Image source={require('../assets/home.png')} style={styles.tabIcon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('MyPage')}>
        <Image source={require('../assets/user.png')} style={styles.tabIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',   // 화면 아래 고정
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
