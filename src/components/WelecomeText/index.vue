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
  return (
    info?.nickName
    || info?.realName
    || info?.username
    || info?.userName
    || info?.user?.nickName
    || info?.user?.realName
    || info?.user?.username
    || '用户'
  );
});
</script>

<template>
  <div
    class="welcome-text w-full flex flex-wrap items-center justify-center text-center text-lg font-semibold mb-32px mt-12px font-size-32px line-height-32px"
  >
    <Typewriter
      :content="`${greeting}好，${username}`"
      :typing="{
        step: 2,
        interval: 45,
      }"
      :is-fog="{
        bgColor: '#fff',
      }"
    />
  </div>
</template>

<style scoped lang="scss">
:deep {
  .typer-container {
    overflow: initial;
  }
}
</style>
