<!-- 欢迎提示词 -->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Typewriter } from 'vue-element-plus-x';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';
import { useUserStore } from '@/stores';

const greeting = useTimeGreeting();
const userStore = useUserStore();

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo();
  }
});

const username = computed(() => {
  const info = userStore.userInfo as any;
  const targetName =
    info?.nickName
    || info?.nickname
    || info?.realName
    || info?.username
    || info?.userName
    || info?.user?.nickName
    || info?.user?.nickname
    || info?.user?.realName
    || info?.user?.username
    || info?.user?.userName
    || info?.data?.user?.nickName
    || info?.data?.user?.nickname
    || info?.data?.user?.realName
    || info?.data?.user?.userName
    || info?.data?.user?.username
    || info?.data?.nickName
    || info?.data?.userName;

  return targetName || '用户';
});
</script>

<template>
  <div
    class="welcome-text w-full flex flex-wrap items-center justify-center text-center font-bold mb-32px mt-12px text-2xl text-slate-800 tracking-wide select-none"
  >
    <span>{{ greeting }}好，{{ username }}，接下来想聊点什么？</span>
  </div>
</template>

<style scoped lang="scss">
:deep {
  .typer-container {
    overflow: initial;
  }
}
</style>
