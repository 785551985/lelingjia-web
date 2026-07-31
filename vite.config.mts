process.env.ROLLUP_SKIP_NODE_NATIVE_DEPENDENCY = 'true';

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import plugins from './.build/plugins';

// https://vite.dev/config/
export default defineConfig((cnf) => {
  const { mode } = cnf;
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    plugins: plugins(cnf),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      // css全局变量使用，@/styles/variable.scss文件
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/var.scss" as *;',
        },
      },
    },
    // 浏览器缓存问题与监听网络绑定
    server: {
      host: '0.0.0.0',
      port: 5173,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  };
});
