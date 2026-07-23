<template>
  <div class="knowledge-chat-container">
    <!-- 侧边栏：知识库选择 -->
    <div class="kb-sidebar">
      <div class="sidebar-header">
        <div class="kb-header-left">
          <span>企业知识库</span>
          <el-button type="primary" size="small" style="margin-left: 15px;" @click="$router.push('/knowledge-manage')">
            ⚙️ 知识库管理后台
          </el-button>
        </div>
      </div>
      <div class="kb-list">
        <div 
          v-for="item in kbList" 
          :key="item.id" 
          :class="['kb-item', { active: currentKbId === item.id }]"
          @click="selectKb(item.id)"
        >
          <span class="kb-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </span>
          <div class="kb-info">
            <span class="kb-name">{{ item.kbName }}</span>
            <span class="kb-tag" :class="item.kbType === '1' ? 'tag-group' : 'tag-tenant'">
              {{ item.kbType === '1' ? '集团公共' : '租户私有' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主对话区域 -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="kb-title-info">
          <h2>{{ activeKbName }}</h2>
          <p class="kb-desc">支持集团合规SOP及租户文档智能混合检索，版本更新实时避障。</p>
        </div>
      </div>

      <!-- 对话历史列表 -->
      <div class="message-list" ref="messageListRef">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>您好！我是您的企业知识库助手</h3>
          <p>请选择左侧的知识库，然后向我提问有关规章制度、报销标准等问题。</p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message-item', msg.role]"
        >
          <div class="avatar">
            <span v-if="msg.role === 'user'">我</span>
            <span v-else>AI</span>
          </div>
          <div class="message-bubble-wrapper">
            <div class="message-bubble">
              <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
            </div>

            <!-- 引用来源展示卡片 -->
            <div v-if="msg.sources && msg.sources.length > 0" class="sources-container">
              <div class="sources-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                引用来源 (共 {{ msg.sources.length }} 条)
              </div>
              <div class="sources-list">
                <div 
                  v-for="(source, sIdx) in msg.sources" 
                  :key="sIdx" 
                  class="source-card"
                  @click="previewPdf(source)"
                >
                  <div class="source-card-header">
                    <span class="doc-name" :title="source.docName">{{ source.docName }}</span>
                    <span class="match-score">匹配度 {{ (source.similarityScore * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="source-card-body">
                    <p class="source-snippet">"{{ source.contentChunk }}"</p>
                    <span class="page-tag">第 {{ source.pageNumber }} 页</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入栏 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <el-input
            v-model="inputQuery"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题... (按 Enter 发送，Shift + Enter 换行)"
            resize="none"
            :disabled="loading"
            @keydown.enter.prevent="handleEnter"
          />
          <div class="input-actions">
            <el-button 
              type="primary" 
              :loading="loading" 
              class="send-btn"
              @click="sendMessage"
            >
              发送提问
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF 预览 Dialog -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="75%"
      destroy-on-close
      align-center
      class="pdf-preview-dialog"
    >
      <div class="pdf-container">
        <div class="pdf-info-bar">
          <el-tag type="info">定位页码：第 {{ selectedPage }} 页</el-tag>
          <span class="pdf-tip">（若浏览器内置 PDF 插件支持，页面将自动滚动至目标页码）</span>
        </div>
        <!-- 核心优雅跳转：使用 iframe 路径拼接 #page=页码 -->
        <iframe 
          v-if="pdfUrl" 
          :src="`${pdfUrl}#page=${selectedPage}`" 
          class="pdf-iframe" 
          frameborder="0"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// 模拟知识库数据
const kbList = ref([
  { id: 1, kbName: '集团合规公共库', kbType: '1' },
  { id: 2, kbName: '绍兴分公司制度库', kbType: '2' }
])

const currentKbId = ref(1)
const inputQuery = ref('')
const loading = ref(false)
const messages = ref([])

// PDF 预览相关响应式变量
const previewVisible = ref(false)
const previewTitle = ref('')
const selectedPage = ref(1)
const pdfUrl = ref('')

const messageListRef = ref(null)

const activeKbName = computed(() => {
  const kb = kbList.value.find(item => item.id === currentKbId.value)
  return kb ? kb.kbName : '规章制度知识库'
})

// 选择知识库
const selectKb = (id) => {
  if (loading.value) return
  currentKbId.value = id
  messages.value = [] // 切换知识库清空对话
  ElMessage.success(`已切换至知识库: ${activeKbName.value}`)
}

// 模拟 Markdown 渲染
const renderMarkdown = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 处理 Enter 发送
const handleEnter = (e) => {
  if (e.shiftKey) {
    return 
  }
  sendMessage()
}

// PDF 预览跳转
const previewPdf = (source) => {
  previewTitle.value = `文档预览: ${source.docName}`
  selectedPage.value = source.pageNumber
  pdfUrl.value = 'https://arxiv.org/pdf/1706.03762.pdf' // 默认演示
  previewVisible.value = true
}

// 发送提问（对接真实后端 RAG SSE 接口，含首包 [SOURCES] 的解析）
const sendMessage = async () => {
  const query = inputQuery.value.trim()
  if (!query) return
  if (loading.value) return

  messages.value.push({
    role: 'user',
    content: query
  })

  inputQuery.value = ''
  loading.value = true
  await scrollToBottom()

  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    sources: []
  })

  const requestHistory = messages.value
    .slice(0, -2) 
    .slice(-8)    
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))

  try {
    // 发起真正的 SSE 流式请求，若依系统下通常会代理 VITE_APP_BASE_API
    const baseApi = import.meta.env.VITE_APP_BASE_API || ''
    const response = await fetch(`${baseApi}/knowledge/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (userStore.token || '')
      },
      body: JSON.stringify({
        kbId: currentKbId.value,
        query: query,
        history: requestHistory
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP 异常: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 暂存未拼完的半行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data:')) {
          const rawData = trimmed.substring(5).trim()
          if (!rawData) continue

          // 解析首部可能携带的引用来源
          if (rawData.startsWith('[SOURCES]:')) {
            try {
              const sourcesJson = rawData.substring(10).trim()
              messages.value[aiMessageIndex].sources = JSON.parse(sourcesJson)
            } catch (e) {
              console.error('解析引用来源失败', e)
            }
          } else {
            // 普通对话内容追加
            messages.value[aiMessageIndex].content += rawData
            await scrollToBottom()
          }
        }
      }
    }
    loading.value = false

  } catch (error) {
    console.warn('请求后端失败，开启本地 Mock 降级展示模式...', error)
    
    // 降级本地 Mock 模式
    let progress = 0
    const mockAnswer = `【本地Mock降级输出】根据《关于调整集团差旅伙食补贴的补充规定.pdf (v2.0)》[生效时间：2025年6月]，集团员工出差的伙食补贴标准已正式调整为每日 150 元。此前《集团报销合规管理办法.pdf (v1.0)》规定的每日 100 元标准已被废止。\n\n由于您属于绍兴分公司，根据《分支机构差旅自主管理办法.pdf (v1.1)》，分支机构员工的本地出差补贴按集团标准的 80% 执行。因此您的标准应为：150元 × 80% = 120元 / 天。`
    
    const mockSources = [
      { docId: 102, docName: '关于调整集团差旅伙食补贴的补充规定.pdf', version: 'v2.0', pageNumber: 1, contentChunk: '集团员工出差伙食补贴标准自2025年6月起调整为每日 150 元。', similarityScore: 0.92 },
      { docId: 201, docName: '分支机构差旅自主管理办法.pdf', version: 'v1.1', pageNumber: 2, contentChunk: '绍兴分公司员工本地区域出差补贴标准按集团的 80% 执行。', similarityScore: 0.84 },
      { docId: 101, docName: '集团报销合规管理办法.pdf', version: 'v1.0', pageNumber: 3, contentChunk: '集团员工出差伙食补贴标准为每日 100 元。(本规范自2023年起实施)', similarityScore: 0.76 }
    ]

    const interval = setInterval(async () => {
      if (progress < mockAnswer.length) {
        const step = Math.floor(Math.random() * 5) + 2
        messages.value[aiMessageIndex].content += mockAnswer.substring(progress, progress + step)
        progress += step
        await scrollToBottom()
      } else {
        clearInterval(interval)
        messages.value[aiMessageIndex].sources = mockSources
        loading.value = false
        await scrollToBottom()
      }
    }, 30)
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

.knowledge-chat-container {
  display: flex;
  height: 100%; 
  background-color: #F8FAFC;
  font-family: 'Source Sans 3', sans-serif;
  color: #1E293B;
  overflow: hidden;
  width: 100%;
}

.kb-sidebar {
  width: 260px;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.sidebar-header h3 {
  margin: 0;
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #475569;
}

.kb-list {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.kb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-bottom: 6px;
}

.kb-item:hover {
  background-color: #F1F5F9;
}

.kb-item.active {
  background-color: #EFF6FF;
  border: 1px solid #BFDBFE;
}

.kb-icon {
  color: #64748B;
}

.kb-item.active .kb-icon {
  color: #2563EB;
}

.kb-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kb-name {
  font-weight: 500;
  font-size: 13.5px;
}

.kb-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  align-self: flex-start;
}

.tag-group {
  background-color: #FEF3C7;
  color: #D97706;
}

.tag-tenant {
  background-color: #E0F2FE;
  color: #0369A1;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #F8FAFC;
  overflow: hidden;
}

.chat-header {
  background-color: #FFFFFF;
  padding: 14px 20px;
  border-bottom: 1px solid #E2E8F0;
}

.kb-title-info h2 {
  margin: 0 0 2px 0;
  font-family: 'Lexend', sans-serif;
  font-weight: 700;
  font-size: 17px;
  color: #0F172A;
}

.kb-desc {
  margin: 0;
  font-size: 12px;
  color: #64748B;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  margin: auto;
  text-align: center;
  max-width: 440px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-family: 'Lexend', sans-serif;
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #1E293B;
}

.empty-state p {
  font-size: 13px;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.assistant {
  align-self: flex-start;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  flex-shrink: 0;
}

.message-item.user .avatar {
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  color: #FFFFFF;
}

.message-item.assistant .avatar {
  background: #E2E8F0;
  color: #475569;
}

.message-bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: calc(100% - 44px);
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 10px;
  line-height: 1.5;
  font-size: 14px;
}

.message-item.user .message-bubble {
  background-color: #3B82F6;
  color: #FFFFFF;
  border-bottom-right-radius: 2px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.message-item.assistant .message-bubble {
  background-color: #FFFFFF;
  color: #1E293B;
  border: 1px solid #E2E8F0;
  border-bottom-left-radius: 2px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
}

.message-content {
  word-break: break-all;
}

.message-content :deep(a) {
  color: #2563EB;
  text-decoration: underline;
}

.sources-container {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sources-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748B;
  font-weight: 600;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-card {
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px dashed #CBD5E1;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-card:hover {
  border-color: #3B82F6;
  background-color: #F8FAFC;
  transform: translateY(-1px);
}

.source-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.doc-name {
  font-weight: 600;
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.match-score {
  font-size: 10px;
  color: #10B981;
  background-color: #ECFDF5;
  padding: 1px 5px;
  border-radius: 4px;
}

.source-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.source-snippet {
  margin: 0;
  font-size: 11.5px;
  color: #64748B;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.page-tag {
  font-size: 10px;
  color: #2563EB;
  align-self: flex-end;
  background-color: #EFF6FF;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
}

.chat-input-area {
  padding: 12px 20px 20px 20px;
  background-color: #FFFFFF;
  border-top: 1px solid #E2E8F0;
}

.input-wrapper {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 6px;
  background-color: #FFFFFF;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.06);
}

.input-wrapper :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 4px;
  font-size: 14px;
  background: transparent;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  border-top: 1px solid #F1F5F9;
  padding-top: 6px;
}

.send-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-weight: 500;
}

.pdf-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  height: 65vh;
}

.pdf-info-bar {
  padding: 8px 14px;
  background-color: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pdf-tip {
  font-size: 11px;
  color: #94A3B8;
}

.pdf-iframe {
  width: 100%;
  flex: 1;
  border: none;
}
</style>
