<!-- 头像 -->
<script setup lang="ts">
import Popover from '@/components/Popover/index.vue';
import SvgIcon from '@/components/SvgIcon/index.vue';
import { useUserStore } from '@/stores';
import { useSessionStore } from '@/stores/modules/session';

const userStore = useUserStore();
const sessionStore = useSessionStore();
const userInitial = computed(() => {
  const name = userStore.userInfo?.username || userStore.userInfo?.nickName || 'Admin';
  return name.charAt(0).toUpperCase();
});

const hasCustomAvatar = computed(() => {
  const rawAvatar = userStore.userInfo?.avatar;
  return !!(rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim().length > 0 && !rawAvatar.includes('undefined'));
});

const src = computed(() => {
  return hasCustomAvatar.value ? (userStore.userInfo?.avatar as string) : '';
});

/* 弹出面板 开始 */
const popoverStyle = ref({
  width: '200px',
  padding: '4px',
  height: 'fit-content',
});
const popoverRef = ref();

// 弹出面板内容
const popoverList = ref([
  {
    key: 'admin',
    title: '返回管理后台',
    icon: 'settings-4-fill',
  },
  {
    key: '3',
    divider: true,
  },
  {
    key: '4',
    title: '退出登录',
    icon: 'logout-box-r-line',
  },
]);

// 点击
function handleClick(item: any) {
  switch (item.key) {
    case 'admin':
      popoverRef.value?.hide?.();
      window.location.href = import.meta.env.VITE_ADMIN_URL || 'https://mgr.ylglxt.cn';
      break;
    case '4':
      popoverRef.value?.hide?.();
      ElMessageBox.confirm('退出登录不会丢失任何数据，你仍可以登录此账号。', '确认退出登录？', {
        confirmButtonText: '确认退出',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        cancelButtonClass: 'el-button--info',
        roundButton: true,
        autofocus: false,
      })
        .then(async () => {
          // 在这里执行退出方法
          await userStore.logout();
          // 清空回话列表并回到默认页
          await sessionStore.requestSessionList(1, true);
          await sessionStore.createSessionBtn();
          ElMessage({
            type: 'success',
            message: '退出成功',
          });
        })
        .catch(() => {
          // ElMessage({
          //   type: 'info',
          //   message: '取消',
          // });
        });
      break;
    default:
      break;
  }
}

/* 弹出面板 结束 */
</script>

<template>
  <div class="avatar-container">
    <Popover
      ref="popoverRef"
      placement="bottom-end"
      trigger="clickTarget"
      :trigger-style="{ cursor: 'pointer' }"
      popover-class="popover-content"
      :popover-style="popoverStyle"
    >
      <!-- 触发元素插槽 -->
      <template #trigger>
        <div class="user-avatar-badge hover:scale-105 transition-all duration-200">
          <el-avatar v-if="hasCustomAvatar" :src="src" :size="34" fit="cover" shape="circle" class="shadow-sm border-2 border-white" />
          <div v-else class="default-gradient-avatar">
            <span class="avatar-initial">{{ userInitial }}</span>
          </div>
        </div>
      </template>

      <div class="popover-content-box shadow-lg">
        <div v-for="item in popoverList" :key="item.key" class="popover-content-box-items h-full">
          <div
            v-if="!item.divider"
            class="popover-content-box-item flex items-center h-full gap-8px p-8px pl-10px pr-12px rounded-lg hover:cursor-pointer hover:bg-[rgba(0,0,0,.04)]"
            @click="handleClick(item)"
          >
            <SvgIcon :name="item.icon!" size="16" class-name="flex-none" />
            <div class="popover-content-box-item-text font-size-14px text-overflow max-h-120px">
              {{ item.title }}
            </div>
          </div>

          <div v-if="item.divider" class="divder h-1px bg-gray-200 my-4px" />
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.popover-content {
  width: 520px;
  height: 520px;
}
.popover-content-box {
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
}

.default-gradient-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
  user-select: none;
}

.avatar-initial {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
