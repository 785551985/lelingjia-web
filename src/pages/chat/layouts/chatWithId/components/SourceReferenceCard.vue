<script setup lang="ts">
import {
  ArrowRight,
  FolderOpened,
  Lock,
} from '@element-plus/icons-vue';
import { ref } from 'vue';
import { useUserStore } from '@/stores';
import ApplyDownloadModal from './ApplyDownloadModal.vue';
import WatermarkPreviewModal from './WatermarkPreviewModal.vue';

export interface KnowledgeSource {
  docId?: string;
  name: string;
  knowledgeName?: string;
  knowledgeId?: number;
  ossId?: number;
  downloadUrl?: string;
  score?: number;
  snippet?: string;
  isSensitive?: boolean;
}

defineProps<{
  sources: KnowledgeSource[];
}>();

const userStore = useUserStore();
const isExpanded = ref(false);

// Sensitive Keywords
const SENSITIVE_KEYWORDS = ['营业执照', '公章', '资质', '身份证', '法人', '财报', '财务报表', '许可', '商标', '专利', '合同'];

function isSensitiveFile(source: KnowledgeSource): boolean {
  if (source.isSensitive)
    return true;
  const name = source.name || '';
  return SENSITIVE_KEYWORDS.some(k => name.includes(k));
}

// Modal State
const previewModalVisible = ref(false);
const applyModalVisible = ref(false);

const selectedSource = ref<KnowledgeSource | null>(null);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function openPreview(source: KnowledgeSource) {
  selectedSource.value = source;
  previewModalVisible.value = true;
}

function openApply(source: KnowledgeSource) {
  selectedSource.value = source;
  applyModalVisible.value = true;
}

function getExtBadge(name: string) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')
    return { text: 'PDF', color: '#f56c6c', bg: '#fef0f0' };
  if (['doc', 'docx'].includes(ext))
    return { text: 'DOC', color: '#409eff', bg: '#ecf5ff' };
  if (['xls', 'xlsx'].includes(ext))
    return { text: 'XLS', color: '#67c23a', bg: '#f0f9eb' };
  if (['png', 'jpg', 'jpeg'].includes(ext))
    return { text: 'IMG', color: '#e6a23c', bg: '#fdf6ec' };
  return { text: 'FILE', color: '#909399', bg: '#f4f4f5' };
}

function getFileUrl(source: KnowledgeSource | null): string {
  if (!source || !source.downloadUrl)
    return '';
  let url = source.downloadUrl.replace('/resource/oss/download/', '/resource/oss/preview/');
  if (!url.startsWith('http')) {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    url = baseUrl + url;
  }
  const token = userStore.token || localStorage.getItem('token') || '';
  const clientId = import.meta.env.VITE_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e';
  if (token && !url.includes('Authorization=')) {
    const authParam = `Authorization=${encodeURIComponent(`Bearer ${token}`)}`;
    const clientParam = `client_id=${encodeURIComponent(clientId)}&ClientID=${encodeURIComponent(clientId)}`;
    url += `${url.includes('?') ? '&' : '?'}${authParam}&${clientParam}`;
  }
  return url;
}
</script>

<template>
  <div v-if="sources && sources.length" class="sources-card-wrapper">
    <!-- Sleek Bar Header -->
    <div class="bar-header" @click="toggleExpand">
      <div class="header-left">
        <el-icon class="header-icon">
          <FolderOpened />
        </el-icon>
        <span class="header-title">参考来源</span>
        <span class="count-badge">{{ sources.length }} 篇关联文档</span>
      </div>
      <div class="header-right">
        <span class="toggle-text">{{ isExpanded ? '收起' : '展开详情' }}</span>
        <el-icon class="arrow-icon" :class="{ 'is-rotated': isExpanded }">
          <ArrowRight />
        </el-icon>
      </div>
    </div>

    <!-- Collapsible Reference List -->
    <el-collapse-transition>
      <div v-show="isExpanded" class="sources-body">
        <div
          v-for="(item, idx) in sources"
          :key="idx"
          class="ref-item"
          :class="{ 'is-sensitive-item': isSensitiveFile(item) }"
          title="点击查看带有防伪水印的在线预览"
          @click="openPreview(item)"
        >
          <!-- Item Header Line -->
          <div class="ref-row">
            <!-- Left Info Section -->
            <div class="ref-meta">
              <span class="index-num">{{ Number(idx) + 1 }}</span>
              <span
                class="ext-chip"
                :style="{ color: getExtBadge(item.name).color, backgroundColor: getExtBadge(item.name).bg }"
              >
                {{ getExtBadge(item.name).text }}
              </span>
              <span class="ref-name" :title="item.name">{{ item.name }}</span>

              <!-- Sensitive Tag -->
              <span v-if="isSensitiveFile(item)" class="tag-chip sensitive">
                <el-icon style="margin-right: 2px;"><Lock /></el-icon>机密资质
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-collapse-transition>

    <!-- Watermark Preview Modal -->
    <WatermarkPreviewModal
      v-if="selectedSource"
      v-model="previewModalVisible"
      :file-name="selectedSource.name"
      :knowledge-name="selectedSource.knowledgeName"
      :snippet="selectedSource.snippet"
      :file-url="getFileUrl(selectedSource)"
      @apply-download="openApply(selectedSource!)"
    />

    <!-- Apply Download Modal -->
    <ApplyDownloadModal
      v-if="selectedSource"
      v-model="applyModalVisible"
      :file-name="selectedSource.name"
    />
  </div>
</template>

<style scoped>
.sources-card-wrapper {
  margin-top: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

:deep(.dark) .sources-card-wrapper {
  background: #1e222b;
  border-color: #333844;
}

.bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8f9fa;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #edf0f5;
}

:deep(.dark) .bar-header {
  background: #252a35;
  border-color: #333844;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #409eff;
  font-size: 16px;
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

:deep(.dark) .header-title {
  color: #e5eaf3;
}

.count-badge {
  font-size: 11px;
  padding: 1px 7px;
  background: #eef5ff;
  color: #409eff;
  border-radius: 10px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.arrow-icon {
  transition: transform 0.2s ease;
}

.arrow-icon.is-rotated {
  transform: rotate(90deg);
}

.sources-body {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ref-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px 12px;
  background: #fafbfc;
  cursor: pointer;
  transition: background 0.2s ease;
}

:deep(.dark) .ref-item {
  background: #232731;
  border-color: #333844;
}

.ref-item:hover {
  background: #f2f5f9;
}

:deep(.dark) .ref-item:hover {
  background: #292e3a;
}

.is-sensitive-item {
  border-left: 3px solid #f56c6c;
}

.ref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ref-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.index-num {
  font-size: 12px;
  font-weight: 700;
  color: #909399;
  min-width: 14px;
}

.ext-chip {
  display: inline-block;
  white-space: nowrap;
  line-height: 1.2;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.ref-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

:deep(.dark) .ref-name {
  color: #e5eaf3;
}

.tag-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.tag-chip.sensitive {
  background: #fef0f0;
  color: #f56c6c;
  font-weight: 600;
}

.tag-chip.kb {
  background: #f4f4f5;
  color: #73767a;
}

:deep(.dark) .tag-chip.kb {
  background: #333844;
  color: #b1b3b8;
}

.tag-chip.score {
  background: #f0f9eb;
  color: #67c23a;
  font-weight: 500;
}

.ref-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.btn-action.text-btn {
  background: transparent;
  color: #409eff;
}

.btn-action.text-btn:hover {
  background: #ecf5ff;
}

.icon-only-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #ffffff;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-only-btn:hover {
  background: #ecf5ff;
  color: #409eff;
  border-color: #b3d8ff;
}

.btn-action.download-btn {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}

.btn-action.download-btn:hover {
  background: #409eff;
  color: #ffffff;
}

.btn-action.preview-warning {
  background: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

.btn-action.preview-warning:hover {
  background: #e6a23c;
  color: #ffffff;
}

.btn-action.apply-primary {
  background: #409eff;
  color: #ffffff;
}

.btn-action.apply-primary:hover {
  background: #66b1ff;
}

.snippet-drawer {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f4f5f8;
  border-left: 3px solid #409eff;
  border-radius: 0 4px 4px 0;
}

:deep(.dark) .snippet-drawer {
  background: #1a1d24;
}

.snippet-label {
  font-size: 11px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.snippet-text {
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.dark) .snippet-text {
  color: #a6a9ad;
}
</style>
