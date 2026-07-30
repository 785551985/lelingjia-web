// 引入ElementPlus所有图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { createApp } from 'vue';
import ElementPlusX from 'vue-element-plus-x';
import App from './App.vue';
import router from './routers';
import store from './stores';
import { useUserStore } from './stores/modules/user';
import './styles/index.scss';
import 'virtual:uno.css';
import 'element-plus/dist/index.css';
// SVG插件配置
import 'virtual:svg-icons-register';

const app = createApp(App);

app.use(store);

// 处理从 ruoyi-admin (5666) 单点跳转过来的免登 Token
try {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    const cleanToken = decodeURIComponent(token).replace(/^Bearer\s+/i, '');
    const userStore = useUserStore();
    userStore.setToken(cleanToken);
    localStorage.setItem('Admin-Token', cleanToken);
    
    // 同步更新 pinia-plugin-persistedstate 对应的 user 本地对象
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      userObj.token = cleanToken;
      localStorage.setItem('user', JSON.stringify(userObj));
    } catch (ignored) {}

    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
} catch (e) {
  console.warn('解析单点登录Token失败:', e);
}

app.use(router);
app.use(ElMessage);
app.use(ElementPlusX);
// 注册ElementPlus所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
