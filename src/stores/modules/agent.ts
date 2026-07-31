import type { AgentVO } from '@/api/agent/types';
import { defineStore } from 'pinia';
import { getAgentList } from '@/api';
import { useUserStore } from './user';

// 智能体管理
export const useAgentStore = defineStore('agent', () => {
  // 当前智能体
  const currentAgentInfo = ref<AgentVO>({});

  // 设置当前智能体
  const setCurrentAgentInfo = (agentInfo: AgentVO) => {
    currentAgentInfo.value = agentInfo;
  };

  // 智能体列表
  const agentList = ref<AgentVO[]>([]);
  // 请求智能体列表
  const requestAgentList = async () => {
    const userStore = useUserStore();
    if (!userStore.token) {
      return;
    }

    try {
      const res = await getAgentList();
      agentList.value = res.data;
      if (agentList.value && agentList.value.length > 0) {
        // 默认选中"集团官方通用 AI 助手"（或包含“通用”关键词的智能体）
        const generalAgent = agentList.value.find(
          item => item.agentName?.includes('通用') || item.agentName?.includes('集团官方通用')
        ) || agentList.value[0];

        if (!currentAgentInfo.value || !currentAgentInfo.value.agentName) {
          currentAgentInfo.value = generalAgent;
        }
      }
    }
    catch (error) {
      console.error('requestAgentList错误', error);
    }
  };

  return {
    currentAgentInfo,
    setCurrentAgentInfo,
    agentList,
    requestAgentList,
  };
});
