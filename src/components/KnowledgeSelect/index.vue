<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Collection } from '@element-plus/icons-vue'
import { getKnowledgeList } from '@/api/knowledge'

const currentKb = ref({ id: '0', name: '全库智能检索' })

const kbOptions = ref<Array<{ id: string; name: string }>>([
  { id: '0', name: '全库智能检索' }
])

const handleSelect = (item: any) => {
  currentKb.value = item
  localStorage.setItem('selectedKbId', item.id)
}

onMounted(async () => {
  try {
    const res = await getKnowledgeList({ pageNum: 1, pageSize: 50 })
    if (res && res.rows && res.rows.length > 0) {
      const realList = res.rows.map((item: any) => ({
        id: String(item.id),
        name: item.name
      }))
      kbOptions.value = [
        { id: '0', name: '全库智能检索' },
        ...realList
      ]
    }
  } catch (err) {
    console.warn('获取知识库列表失败:', err)
  }
})
</script>

<template>
  <el-dropdown trigger="click">
    <el-button class="kb-select-btn" rounded size="small">
      <el-icon class="mr-4px"><Collection /></el-icon>
      <span>{{ currentKb.name }}</span>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item 
          v-for="item in kbOptions" 
          :key="item.id"
          @click="handleSelect(item)"
        >
          <span :class="{ 'font-bold': currentKb.id === item.id }">{{ item.name }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.kb-select-btn {
  border-color: #dcdfe6;
  color: #409eff;
  background-color: #ecf5ff;
}
</style>
