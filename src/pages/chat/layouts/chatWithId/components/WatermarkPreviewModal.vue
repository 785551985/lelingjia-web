<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUserStore } from '@/stores/modules/user';
import { WarningFilled, Document } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  fileName: string;
  knowledgeName?: string;
  snippet?: string;
  fileUrl?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'applyDownload'): void;
}>();

const userStore = useUserStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const loading = ref(false);
const docxContainerRef = ref<HTMLElement | null>(null);
const excelHtmlContent = ref('');
const sheetNames = ref<string[]>([]);
const currentSheet = ref<string>('');
const excelWorkbook = ref<any>(null);
const textContent = ref('');

const watermarkText = computed(() => {
  const name = userStore.userInfo?.nickName || userStore.userInfo?.username || '乐龄家员工';
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${name} 内部机密 ${dateStr}`;
});

const ext = computed(() => (props.fileName.split('.').pop() || '').toLowerCase());

const isPdf = computed(() => ['pdf', 'html'].includes(ext.value));
const isImage = computed(() => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext.value));
const isExcel = computed(() => ['xlsx', 'xls', 'csv'].includes(ext.value));
const isDocx = computed(() => ['docx', 'doc'].includes(ext.value));
const isText = computed(() => ['txt', 'md', 'json', 'sql', 'xml', 'log', 'java', 'py', 'js', 'ts', 'css'].includes(ext.value));

const pdfUrlWithParams = computed(() => {
  if (!props.fileUrl) return '';
  let url = props.fileUrl;
  if (url.includes('#')) return url;
  return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
});

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

function waitForRef<T>(getter: () => T | null, maxWaitMs = 3000): Promise<T | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const val = getter();
      if (val) {
        resolve(val);
      } else if (Date.now() - start > maxWaitMs) {
        resolve(null);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

function selectSheet(name: string) {
  currentSheet.value = name;
  if (excelWorkbook.value && excelWorkbook.value.Sheets[name]) {
    const XLSX = (window as any).XLSX;
    const sheet = excelWorkbook.value.Sheets[name];
    if (sheet && XLSX) {
      excelHtmlContent.value = XLSX.utils.sheet_to_html(sheet);
    }
  }
}

async function loadFileContent() {
  if (!props.fileUrl || !visible.value) return;

  if (isExcel.value) {
    loading.value = true;
    excelHtmlContent.value = '';
    sheetNames.value = [];
    currentSheet.value = '';
    excelWorkbook.value = null;
    try {
      if (!(window as any).XLSX) {
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      }
      const XLSX = (window as any).XLSX;
      const res = await fetch(props.fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      excelWorkbook.value = workbook;
      sheetNames.value = workbook.SheetNames || [];
      if (sheetNames.value.length > 0) {
        selectSheet(sheetNames.value[0]);
      }
    } catch (e) {
      console.warn('Excel 网页解析失败:', e);
    } finally {
      loading.value = false;
    }
  } else if (isDocx.value) {
    loading.value = true;
    try {
      if (!(window as any).docx) {
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.1.15/dist/docx-preview.min.js'),
        ]);
      }
      const docx = (window as any).docx;
      const res = await fetch(props.fileUrl);
      const blob = await res.blob();
      
      const container = await waitForRef(() => docxContainerRef.value, 3500);
      if (container && docx) {
        container.innerHTML = '';
        await docx.renderAsync(blob, container);
      } else {
        console.warn('Docx 容器未就绪，重试渲染');
      }
    } catch (e) {
      console.warn('Docx 渲染失败:', e);
    } finally {
      loading.value = false;
    }
  } else if (isText.value) {
    loading.value = true;
    try {
      const res = await fetch(props.fileUrl);
      textContent.value = await res.text();
    } catch (e) {
      console.warn('文本内容拉取失败:', e);
    } finally {
      loading.value = false;
    }
  }
}

watch([() => props.fileUrl, visible], () => {
  if (visible.value) {
    loadFileContent();
  }
});

function handleApplyClick() {
  visible.value = false;
  emit('applyDownload');
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="👁️ 附件原件受控水印预览"
    width="1140px"
    top="4vh"
    destroy-on-close
    append-to-body
    class="watermark-preview-dialog"
    @opened="loadFileContent"
  >
    <div class="security-banner">
      <el-icon class="banner-icon"><WarningFilled /></el-icon>
      <div class="banner-text">
        <strong>源文件防伪水印提示：</strong>
        本页面展示原件在线受控文档，系统已自动叠加您的动态防护水印（姓名+工号+日期）。严禁翻拍或截图泄露。
      </div>
    </div>

    <!-- Preview Container with Watermark Overlay -->
    <div v-loading="loading" class="preview-stage" @contextmenu.prevent @copy.prevent>
      <!-- Staggered Enterprise Watermark Grid -->
      <div class="watermark-overlay">
        <div v-for="n in 12" :key="n" class="watermark-item">
          {{ watermarkText }}
        </div>
      </div>

      <!-- Preview Content -->
      <div class="document-box">
        <div class="doc-header">
          <el-icon class="doc-icon"><Document /></el-icon>
          <span class="doc-name">{{ fileName }}</span>
          <span v-if="knowledgeName" class="doc-meta-badge">
            归属知识库：{{ knowledgeName }}
          </span>
        </div>

        <!-- 1. PDF / HTML Viewer -->
        <div v-if="fileUrl && isPdf" class="real-file-viewer">
          <iframe
            :src="pdfUrlWithParams"
            class="source-file-iframe"
            frameborder="0"
          ></iframe>
        </div>

        <!-- 2. Image Viewer -->
        <div v-else-if="fileUrl && isImage" class="real-file-viewer">
          <img
            :src="fileUrl"
            class="source-file-img"
            alt="原件预览"
          />
        </div>

        <!-- 3. Excel Spreadsheet Viewer -->
        <div v-else-if="fileUrl && isExcel" class="excel-view-container">
          <div v-if="sheetNames.length > 1" class="excel-sheet-tabs">
            <span
              v-for="name in sheetNames"
              :key="name"
              class="sheet-tab"
              :class="{ active: currentSheet === name }"
              @click="selectSheet(name)"
            >
              📄 {{ name }}
            </span>
          </div>
          <div v-if="excelHtmlContent" class="excel-table-wrapper" v-html="excelHtmlContent"></div>
          <div v-else class="snippet-preview-body">
            <div class="body-title">受控文档全量解析文本内容：</div>
            <div class="body-text">{{ snippet || '暂无表格数据' }}</div>
          </div>
        </div>

        <!-- 4. Word Docx Document Viewer -->
        <div v-else-if="fileUrl && isDocx" class="docx-view-container">
          <div ref="docxContainerRef" class="docx-render-box"></div>
          <div v-if="!docxContainerRef" class="snippet-preview-body">
            <div class="body-title">受控文档全量解析文本内容：</div>
            <div class="body-text">{{ snippet || '暂无文档内容' }}</div>
          </div>
        </div>

        <!-- 5. Pure Text / Code File Viewer -->
        <div v-else-if="fileUrl && isText" class="snippet-preview-body">
          <div class="body-title">受控源文件文本内容：</div>
          <pre class="body-text code-pre">{{ textContent || snippet || '暂无文本内容' }}</pre>
        </div>

        <!-- 6. Fallback Text Snippet Viewer -->
        <div v-else class="snippet-preview-body">
          <div class="body-title">受控文档已索引全量文本内容：</div>
          <div class="body-text">{{ snippet || '暂无详细文本内容' }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="footer-tip">如需无水印原件，请提交领用申请：</span>
        <el-button type="primary" plain icon="Lock" @click="handleApplyClick">
          📝 申请下载无水印原件
        </el-button>
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.security-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 14px;
}

.banner-icon {
  font-size: 18px;
  margin-top: 1px;
}

.preview-stage {
  position: relative;
  min-height: 580px;
  height: 72vh;
  max-height: 75vh;
  overflow-y: auto;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  user-select: none;
}

.real-file-viewer {
  width: 100%;
  height: calc(72vh - 70px);
  min-height: 520px;
  margin-top: 10px;
  position: relative;
  z-index: 1;
}

.source-file-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 6px;
  background: #ffffff;
}

.source-file-img {
  max-width: 100%;
  max-height: calc(72vh - 70px);
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

.excel-view-container {
  margin-top: 10px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 12px;
  max-height: calc(72vh - 80px);
  overflow: auto;
  position: relative;
  z-index: 1;
}

.excel-sheet-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 6px;
  overflow-x: auto;
}

.sheet-tab {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  background: #f4f4f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.sheet-tab.active {
  background: #409eff;
  color: #ffffff;
  border-color: #409eff;
}

.excel-table-wrapper :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.excel-table-wrapper :deep(td),
.excel-table-wrapper :deep(th) {
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
}

.excel-table-wrapper :deep(tr:nth-child(even)) {
  background-color: #fafafa;
}

.excel-table-wrapper :deep(tr:first-child) {
  background-color: #f2f6fc;
  font-weight: bold;
}

.docx-view-container {
  margin-top: 10px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 16px;
  max-height: calc(72vh - 80px);
  overflow: auto;
  position: relative;
  z-index: 1;
}

.docx-render-box :deep(.docx-view-wrap) {
  padding: 10px;
}

:deep(.dark) .preview-stage {
  background: #1a1d24;
  border-color: #363b47;
}

:deep(.dark) .excel-view-container,
:deep(.dark) .docx-view-container {
  background: #232731;
  border-color: #363b47;
}

.watermark-overlay {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  align-items: center;
  justify-items: center;
  gap: 50px 20px;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
  opacity: 0.18;
}

.watermark-item {
  transform: rotate(-22deg);
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  user-select: none;
}

.watermark-item:nth-child(even) {
  transform: rotate(-22deg) translateX(40px);
}

:deep(.dark) .watermark-item {
  color: #ffffff;
  opacity: 0.28;
}

.document-box {
  position: relative;
  z-index: 1;
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.dark) .doc-header {
  color: #e5eaf3;
}

.doc-icon {
  color: #409eff;
  font-size: 20px;
}

.snippet-preview-body {
  margin-top: 16px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

:deep(.dark) .snippet-preview-body {
  background: #232731;
  border-color: #363b47;
}

.body-title {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.body-text {
  font-size: 13px;
  line-height: 1.6;
  color: #484a4d;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-pre {
  font-family: Consolas, Monaco, "Courier New", monospace;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 500px;
  overflow: auto;
}

:deep(.dark) .body-text {
  color: #cfd3dc;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-tip {
  font-size: 12px;
  color: #909399;
}
</style>
