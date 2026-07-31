<!-- 切换智能体 / 工作流（统一选择器，二者互斥，动态应用图标） -->
<script setup lang="ts">
import type { AgentVO } from '@/api/agent/types';
import { computed, onMounted, ref } from 'vue';
import Popover from '@/components/Popover/index.vue';
import { useAgentStore } from '@/stores/modules/agent';
import { useChatStore } from '@/stores/modules/chat';

const agentStore = useAgentStore();
const chatStore = useChatStore();

// 当前选中的工作流（全局；为 null 时走智能体对话，与智能体互斥）
const currentWorkflow = computed(() => chatStore.currentWorkflow);

onMounted(async () => {
  await agentStore.requestAgentList();
  // 默认选择集团官方通用 AI 助手（仅当未选工作流时）
  if (
    agentStore.agentList?.length > 0
    && (!agentStore.currentAgentInfo || !agentStore.currentAgentInfo.agentName)
    && !currentWorkflow.value
  ) {
    const generalAgent = agentStore.agentList.find(
      item => item.agentName?.includes('通用') || item.agentName?.includes('集团官方通用'),
    ) || agentStore.agentList[0];
    agentStore.setCurrentAgentInfo(generalAgent);
  }
});

const currentAgentName = computed(
  () => agentStore.currentAgentInfo?.agentName || '',
);

// 选择器展示文案：选了工作流 → 工作流标题；否则 → 智能体名
const currentLabel = computed(() =>
  currentWorkflow.value ? currentWorkflow.value.title : currentAgentName.value,
);

const isWorkflow = computed(() => !!currentWorkflow.value);

const popoverList = computed(() => agentStore.agentList);

/**
 * 智能体图标与其专有颜色映射解析
 */
function getAgentIconInfo(agentShow?: string) {
  if (isWorkflow.value) {
    return { isImg: false, icon: 'Connection', color: '#ec4899' };
  }

  if (!agentShow)
    return { isImg: false, icon: 'Cpu', color: '#409eff' };

  if (agentShow.includes('http') || agentShow.includes('/') || agentShow.includes('data:image')) {
    return { isImg: true, src: agentShow };
  }

  switch (agentShow) {
    case 'AuditOutlined':
      return { isImg: false, icon: 'DocumentChecked', color: '#f43f5e' };
    case 'ShoppingOutlined':
      return { isImg: false, icon: 'Goods', color: '#a855f7' };
    case 'SolutionOutlined':
      return { isImg: false, icon: 'Tickets', color: '#f59e0b' };
    case 'CustomerServiceOutlined':
      return { isImg: false, icon: 'Headset', color: '#10b981' };
    case 'RobotOutlined':
      return { isImg: false, icon: 'Cpu', color: '#3b82f6' };
    case 'UserOutlined':
      return { isImg: false, icon: 'User', color: '#6366f1' };
    case 'BulbOutlined':
      return { isImg: false, icon: 'Opportunity', color: '#eab308' };
    case 'SafetyOutlined':
      return { isImg: false, icon: 'Lock', color: '#06b6d4' };
    default:
      return { isImg: false, icon: 'Cpu', color: '#3b82f6' };
  }
}

const currentIconInfo = computed(() =>
  getAgentIconInfo(agentStore.currentAgentInfo?.agentShow),
);

/* 弹出面板 配置 */
const popoverStyle = ref({
  width: '320px',
  padding: '8px',
  height: 'fit-content',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
});
const popoverRef = ref();

// 显示
async function showPopover() {
  await agentStore.requestAgentList();
}

// 点击智能体：清掉工作流（切回智能体模式），再设当前智能体
function handleClick(item: AgentVO) {
  if (currentWorkflow.value) {
    chatStore.clearCurrentWorkflow();
  }
  agentStore.setCurrentAgentInfo(item);
  popoverRef.value?.hide?.();
}

// 退出工作流，回到默认智能体
function handleUnbindWorkflow() {
  chatStore.clearCurrentWorkflow();
  if (agentStore.agentList?.length > 0 && !agentStore.currentAgentInfo?.agentName) {
    agentStore.setCurrentAgentInfo(agentStore.agentList[0]);
  }
  popoverRef.value?.hide?.();
}
</script>

<template>
  <div class="agent-select">
    <Popover
      ref="popoverRef"
      placement="top-start"
      :offset="[4, 0]"
      popover-class="popover-content"
      :popover-style="popoverStyle"
      trigger="clickTarget"
      @show="showPopover"
    >
      <!-- 触发元素插槽 -->
      <template #trigger>
        <div
          class="agent-select-box select-none flex items-center gap-5px px-10px py-5px rounded-8px cursor-pointer font-size-12px"
        >
          <div class="agent-select-box-icon flex items-center justify-center">
            <template v-if="currentIconInfo.isImg">
              <img :src="currentIconInfo.src" class="w-13px h-13px rounded-full object-cover">
            </template>
            <template v-else>
              <el-icon :style="{ color: currentIconInfo.color }" class="text-13px flex-none">
                <component :is="currentIconInfo.icon" />
              </el-icon>
            </template>
          </div>
          <div class="agent-select-box-text font-size-12px font-600 text-overflow max-w-160px">
            {{ currentLabel }}
          </div>
        </div>
      </template>

      <div class="popover-content-box">
        <!-- 当前为工作流模式时，置顶一个"切回智能体"入口 -->
        <div
          v-if="isWorkflow"
          class="popover-item exit-workflow-item"
          @click="handleUnbindWorkflow"
        >
          <div class="item-title">
            <span class="workflow-badge">工作流</span>
            {{ currentWorkflow?.title }}
          </div>
          <div class="item-desc">
            点击退回到智能体模式
          </div>
        </div>

        <div
          v-for="item in popoverList"
          :key="item.id"
          class="popover-item"
          :class="{ 'is-active': !isWorkflow && item.agentName === agentStore.currentAgentInfo?.agentName }"
          @click="handleClick(item)"
        >
          <div class="item-main">
            <div class="item-title-row">
              <div class="flex items-center gap-6px">
                <div class="item-icon-box flex items-center justify-center">
                  <template v-if="getAgentIconInfo(item.agentShow).isImg">
                    <img :src="getAgentIconInfo(item.agentShow).src" class="w-16px h-16px rounded-full object-cover">
                  </template>
                  <template v-else>
                    <el-icon :style="{ color: getAgentIconInfo(item.agentShow).color }" class="text-15px">
                      <component :is="getAgentIconInfo(item.agentShow).icon" />
                    </el-icon>
                  </template>
                </div>
                <span class="item-name">{{ item.agentName }}</span>
              </div>
              <span v-if="!isWorkflow && item.agentName === agentStore.currentAgentInfo?.agentName" class="active-dot" />
            </div>
            <div v-if="item.agentDescribe" class="item-desc">
              {{ item.agentDescribe }}
            </div>
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.agent-select-box {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-color-primary-light-8, #d9ecff);
    border-color: var(--el-color-primary, #409eff);
  }
}

.popover-content-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  padding: 2px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
}

.popover-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  transition: all 0.18s ease-in-out;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  &.is-active {
    background: #eff6ff;
    border-color: #93c5fd;

    .item-name {
      color: #2563eb;
      font-weight: 600;
    }
  }
}

.item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.active-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 0 2px #dbeafe;
}

.item-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exit-workflow-item {
  background: #fef2f2;
  border-color: #fecaca;

  &:hover {
    background: #fee2e2;
  }

  .item-title {
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
  }

  .item-desc {
    color: #991b1b;
  }
}

.workflow-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  background: #ef4444;
  color: #fff;
  border-radius: 4px;
  margin-right: 6px;
}
</style>
