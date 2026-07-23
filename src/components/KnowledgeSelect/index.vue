<script setup lang="ts">
import { ref } from 'vue'
import { Collection } from '@element-plus/icons-vue'

const currentKb = ref({ id: '1', name: '集团合规公共库 (公共)' })

const kbOptions = [
  { id: '1', name: '集团合规公共库 (公共)', type: '1' },
  { id: '2', name: '绍兴分公司制度库 (私有)', type: '2' },
  { id: '0', name: '全库混合检索 (RAG全检索)', type: '0' }
]

const handleSelect = (item: any) => {
  currentKb.value = item
}
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
