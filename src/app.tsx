import { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
// 全局样式
import './app.scss';

function App(props) {
  const initFromStorage = useAppStore(state => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // 对应 onShow
  useDidShow(() => {
    initFromStorage();
  });

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
