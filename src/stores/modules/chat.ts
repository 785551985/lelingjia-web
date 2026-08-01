import type { ChatMessageVo, WfNodeInput, WfNodeInputDef } from '@/api/chat/types';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getChatList } from '@/api';
import { useUserStore } from './user';

/**
 * 工作流与会话的绑定关系。按 sessionId 存，持久化到 localStorage。
 */
export interface WorkflowBinding {
  uuid: string;
  title: string;
  startInputs: WfNodeInputDef[];
  inputs: WfNodeInput[];
  nodeTitles: Record<string, string>;
}

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore();

  // 用户头像
  const avatar = computed(() => {
    const userInfo = userStore.userInfo;
    return userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UserNav';
  });

  // 是否开启深度思考
  const isDeepThinking = ref<boolean>(false);

  const setDeepThinking = (value: boolean) => {
    isDeepThinking.value = value;
  };

  // 知识库ID
  const knowledgeId = ref<string>('');

  const setKnowledgeId = (id: string) => {
    knowledgeId.value = id;
  };

  // 会议ID对应-聊天记录 map对象
  const chatMap = ref<Record<string, ChatMessageVo[]>>({});

  // 当前选中的工作流
  const currentWorkflow = ref<WorkflowBinding | null>(null);

  const setCurrentWorkflow = (wf: WorkflowBinding | null) => {
    currentWorkflow.value = wf;
  };

  const clearCurrentWorkflow = () => {
    currentWorkflow.value = null;
  };

  const extractThkContent = (content: string) => {
    if (!content)
      return '';
    const match = content.match(/<think>([\s\S]*?)<\/think>/);
    return match ? match[1].trim() : '';
  };

  const extractThkContentAfter = (content: string) => {
    if (!content)
      return '';
    return content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  };

  function extractSources(content: string) {
    if (!content)
      return { sources: [], cleanContent: content };
    const regex = /<sources>([\s\S]*?)<\/sources>/;
    const match = content.match(regex);
    if (match) {
      try {
        const sources = JSON.parse(match[1]);
        const cleanContent = content.replace(regex, '').trim();
        return { sources, cleanContent };
      }
      catch (e) {
        console.error('Failed to parse sources JSON', e);
      }
    }
    return { sources: [], cleanContent: content };
  }

  const setChatMap = (id: string, data: ChatMessageVo[]) => {
    chatMap.value[id] = data?.map((item: ChatMessageVo) => {
      const roleStr = String(item.role || '').toLowerCase().trim();
      const isUser = roleStr === 'user';
      const originalContent = (item.content || '') as string;

      const thinkContent = extractThkContent(originalContent);
      const afterThinkContent = extractThkContentAfter(originalContent);
      const { sources, cleanContent } = extractSources(afterThinkContent);

      return {
        ...item,
        key: item.id,
        placement: isUser ? 'end' : 'start',
        isMarkdown: !isUser,
        role: isUser ? 'user' : 'assistant',
        avatar: isUser
          ? avatar.value
          : 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        avatarSize: '32px',
        typing: false,
        reasoning_content: thinkContent,
        thinkingStatus: 'end',
        content: cleanContent,
        sources,
        thinlCollapse: false,
        noStyle: !isUser,
      };
    });
  };

  // 获取当前会话的聊天记录
  const requestChatList = async (sessionId: string) => {
    if (!userStore.token || !sessionId || sessionId === 'undefined' || sessionId === 'null')
      return;
    try {
      const res = await getChatList({
        sessionId,
        userId: userStore.userInfo?.userId as number,
      });
      if (res.rows) {
        setChatMap(sessionId, res.rows);
      }
    }
    catch (error) {
      console.error('getChatList:', error);
    }
  };

  return {
    avatar,
    isDeepThinking,
    setDeepThinking,
    knowledgeId,
    setKnowledgeId,
    chatMap,
    setChatMap,
    requestChatList,
    currentWorkflow,
    setCurrentWorkflow,
    clearCurrentWorkflow,
  };
});
