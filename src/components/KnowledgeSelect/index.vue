<!-- 知识库选择器（文案极简精致：避免冗长文案截断，优雅对齐） -->
<script setup lang="ts">
import { Collection, Document } from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { getKnowledgeList } from '@/api/knowledge';
import { useAgentStore } from '@/stores/modules/agent';

const agentStore = useAgentStore();

// 后端获取的全量知识库缓存映射
const allKnowledgeMap = ref<Record<string, string>>({});

const currentKb = ref({ id: '0', name: '全库智能检索' });

/**
 * 动态计算展示【全库智能检索】和【智能体专属知识库】（精简名称，绝不拼贴长文字）
 */
const kbOptions = computed(() => {
  const list = [{ id: '0', name: '全库智能检索' }];
  const agent = agentStore.currentAgentInfo;

  if (agent && Array.isArray(agent.knowledgeIds) && agent.knowledgeIds.length > 0) {
    agent.knowledgeIds.forEach((kId) => {
      const kIdStr = String(kId);
      // 优先显示实际知识库名；若未加载完则干练显示“专属知识库”
      const kbName = allKnowledgeMap.value[kIdStr] || '专属知识库';
      list.push({
        id: kIdStr,
        name: kbName,
      });
    });
  }
  return list;
});

function handleSelect(item: any) {
  currentKb.value = item;
  localStorage.setItem('selectedKbId', item.id);
}

// 自动响应当前智能体的变更
watch(
  () => agentStore.currentAgentInfo,
  (agent) => {
    if (!agent) {
      currentKb.value = { id: '0', name: '全库智能检索' };
      localStorage.setItem('selectedKbId', '0');
      return;
    }

    const kIds = agent.knowledgeIds;
    if (Array.isArray(kIds) && kIds.length > 0) {
      const firstId = String(kIds[0]);
      const name = allKnowledgeMap.value[firstId] || '专属知识库';
      currentKb.value = { id: firstId, name };
      localStorage.setItem('selectedKbId', firstId);
    }
    else {
      currentKb.value = { id: '0', name: '全库智能检索' };
      localStorage.setItem('selectedKbId', '0');
    }
  },
  { immediate: true, deep: true },
);

onMounted(async () => {
  try {
    const res = await getKnowledgeList({ pageNum: 1, pageSize: 200 });
    if (res && res.rows && res.rows.length > 0) {
      const map: Record<string, string> = {};
      res.rows.forEach((item: any) => {
        map[String(item.id)] = item.name;
      });
      allKnowledgeMap.value = map;

      // 获取完真实知识库名称后，重新校准显示真正的知识库名称
      const agent = agentStore.currentAgentInfo;
      if (agent && Array.isArray(agent.knowledgeIds) && agent.knowledgeIds.length > 0) {
        const firstId = String(agent.knowledgeIds[0]);
        if (map[firstId]) {
          currentKb.value = { id: firstId, name: map[firstId] };
          localStorage.setItem('selectedKbId', firstId);
        }
      }
    }
  }
  catch (err) {
    console.warn('获取知识库名称映射失败:', err);
  }
});
</script>

<template>
  <el-dropdown trigger="click">
    <div
      class="kb-select-btn select-none flex items-center gap-5px px-10px py-5px rounded-8px cursor-pointer font-size-12px"
    >
      <el-icon class="text-13px flex-none" style="color: #409eff;">
        <Collection />
      </el-icon>
      <span class="font-size-12px font-600 text-overflow max-w-120px">{{ currentKb.name }}</span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in kbOptions"
          :key="item.id"
          @click="handleSelect(item)"
        >
          <div class="flex items-center gap-6px py-2px max-w-220px text-overflow">
            <el-icon v-if="item.id === '0'" class="text-13px text-blue-500 flex-none">
              <Collection />
            </el-icon>
            <el-icon v-else class="text-13px text-emerald-500 flex-none">
              <Document />
            </el-icon>
            <span :class="{ 'font-bold text-blue-600': currentKb.id === item.id }" class="text-overflow">{{ item.name }}</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.kb-select-btn {
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
</style>
