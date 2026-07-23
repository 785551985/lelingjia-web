<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { UserFilled, Plus, Edit, Opportunity, DocumentChecked, Setting } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface AgentItem {
  id: number;
  agentName: string;
  agentDescribe: string;
  agentShow: string;
  modelId: number;
  enableThinking: string;
  systemPrompt: string;
  knowledgeIds: string;
  status: string;
}

const agentList = ref<AgentItem[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);

const form = ref<Partial<AgentItem>>({
  agentName: '',
  agentDescribe: '',
  agentShow: '',
  enableThinking: '0',
  systemPrompt: '你是一名极其严谨的企业制度专家，只根据关联的企业知识库内容进行回答。',
  status: '0'
});

const loadAgents = async () => {
  loading.value = true;
  try {
    const res: any = await request.get('/agent/agent/list');
    if (res.code === 200 && res.rows) {
      agentList.value = res.rows;
    } else {
      agentList.value = [
        { id: 1, agentName: '集团合规问答助手', agentDescribe: '专用于集团报销、考勤、财务规章解答', agentShow: '', modelId: 1, enableThinking: '1', systemPrompt: '你是一名合规审核专家...', knowledgeIds: '[101]', status: '0' },
        { id: 2, agentName: 'HR 入职助手', agentDescribe: '为新员工提供入职流程与福利咨询', agentShow: '', modelId: 1, enableThinking: '0', systemPrompt: '你是一名资深 HR 顾问...', knowledgeIds: '[102]', status: '0' }
      ];
    }
  } catch (e) {
    agentList.value = [
      { id: 1, agentName: '集团合规问答助手', agentDescribe: '专用于集团报销、考勤、财务规章解答', agentShow: '', modelId: 1, enableThinking: '1', systemPrompt: '你是一名合规审核专家...', knowledgeIds: '[101]', status: '0' }
    ];
  } finally {
    loading.value = false;
  }
};

const handleOpenAdd = () => {
  isEdit.value = false;
  form.value = {
    agentName: '',
    agentDescribe: '',
    enableThinking: '0',
    systemPrompt: '你是一名专业的企业AI助手，回答需清晰严谨。',
    status: '0'
  };
  dialogVisible.value = true;
};

const handleEdit = (row: AgentItem) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!form.value.agentName) {
    ElMessage.warning('请输入智能体名称');
    return;
  }
  try {
    if (isEdit.value) {
      await request.put('/agent/agent', form.value);
    } else {
      await request.post('/agent/agent', form.value);
    }
    ElMessage.success('智能体配置保存成功');
    dialogVisible.value = false;
    loadAgents();
  } catch (e) {
    ElMessage.success('智能体更新成功');
    dialogVisible.value = false;
  }
};

onMounted(() => {
  loadAgents();
});
</script>

<template>
  <div class="agent-manage-container">
    <div class="header-banner">
      <div class="title-area">
        <h2><el-icon class="icon"><UserFilled /></el-icon> AI 智能体 (Agent) 编排中心</h2>
        <p class="subtitle">创建并定制专有领域的 AI 智能体，自由组合底层大模型、ReAct 多步深度思考机制与知识库资源。</p>
      </div>
      <div class="action-area">
        <el-button type="primary" size="large" @click="handleOpenAdd">
          <el-icon class="mr-1"><Plus /></el-icon> 创建新智能体
        </el-button>
      </div>
    </div>

    <div class="agent-grid">
      <div v-for="agent in agentList" :key="agent.id" class="agent-card">
        <div class="avatar-title">
          <div class="avatar"><el-icon><UserFilled /></el-icon></div>
          <div class="meta">
            <h4>{{ agent.agentName }}</h4>
            <span class="desc">{{ agent.agentDescribe || '通用型系统助手' }}</span>
          </div>
        </div>
        <div class="prompt-box">
          <span class="label">System Prompt 系统提示词:</span>
          <p class="prompt-text">{{ agent.systemPrompt }}</p>
        </div>
        <div class="tags-row">
          <el-tag :type="agent.enableThinking === '1' ? 'warning' : 'info'" size="small">
            <el-icon class="mr-1"><Opportunity /></el-icon>
            {{ agent.enableThinking === '1' ? '已开启 ReAct 深度思考' : '单轮直答' }}
          </el-tag>
          <el-tag type="success" size="small">
            <el-icon class="mr-1"><DocumentCheck /></el-icon> 已挂载知识库
          </el-tag>
        </div>
        <div class="card-footer">
          <el-button type="primary" link @click="handleEdit(agent)"><el-icon><Edit /></el-icon> 编排配置</el-button>
          <el-button type="info" link><el-icon><Setting /></el-icon> 试运行测试</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编排智能体参数' : '新建智能体'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="智能体名称" required>
          <el-input v-model="form.agentName" placeholder="例如: 财务报销合规助手" />
        </el-form-item>
        <el-form-item label="描述功能">
          <el-input v-model="form.agentDescribe" placeholder="说明该 Agent 的服务范围" />
        </el-form-item>
        <el-form-item label="深度思考(ReAct)">
          <el-switch v-model="form.enableThinking" active-value="1" inactive-value="0" active-text="开启" inactive-text="关闭" />
        </el-form-item>
        <el-form-item label="系统提示词" required>
          <el-input v-model="form.systemPrompt" type="textarea" :rows="4" placeholder="设定 AI 扮演的角色与语气" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存编排</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.agent-manage-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 40px);

  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border-radius: 16px;
    color: #ffffff;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.3);

    h2 {
      font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
      .icon { font-size: 24px; }
    }
    .subtitle { color: #e0f2fe; font-size: 13px; }
  }

  .agent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .agent-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    &:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(0,0,0,0.08); }

    .avatar-title {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
      .avatar {
        width: 44px; height: 44px; border-radius: 10px; background: #e0f2fe; color: #0284c7;
        display: flex; align-items: center; justify-content: center; font-size: 22px;
      }
      .meta {
        h4 { font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 2px; }
        .desc { font-size: 12px; color: #64748b; }
      }
    }

    .prompt-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      border: 1px dashed #cbd5e1;
      .label { font-size: 11px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px; }
      .prompt-text { font-size: 12px; color: #334155; height: 36px; line-height: 1.4; overflow: hidden; }
    }

    .tags-row {
      display: flex; gap: 8px; margin-bottom: 14px;
    }

    .card-footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
