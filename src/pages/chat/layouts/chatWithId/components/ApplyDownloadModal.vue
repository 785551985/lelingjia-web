<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentChecked } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  fileName: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const form = ref({
  applyType: '招投标项目',
  reason: '',
  duration: '1天',
  needWatermark: true,
  watermarkNote: '仅限XX项目招投标使用，复印无效',
});

const submitting = ref(false);

function handleSubmit() {
  if (!form.value.reason.trim()) {
    ElMessage.warning('请填写具体领用用途说明');
    return;
  }
  submitting.value = true;
  setTimeout(() => {
    submitting.value = false;
    visible.value = false;
    ElMessage.success({
      message: `【${props.fileName}】领用申请已成功提交至行政/法务部门！审批通过后系统将为您自动发放 ${form.value.duration} 限时下载凭证。`,
      duration: 5000,
    });
    // Reset form
    form.value.reason = '';
  }, 600);
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="📝 敏感资质原件领用与下载申请"
    width="580px"
    destroy-on-close
    append-to-body
    class="apply-download-dialog"
  >
    <el-alert
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;"
    >
      根据集团《敏感数字资产安全管理规范》，下载资质原件需提交领用申请，审批通过后方可获得限时下载凭证。
    </el-alert>

    <el-form label-width="110px" :model="form">
      <el-form-item label="资质文件">
        <el-input :value="fileName" disabled readonly>
          <template #prefix>
            <el-icon><DocumentChecked /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="申请类型" required>
        <el-select v-model="form.applyType" style="width: 100%;">
          <el-option label="招投标项目" value="招投标项目" />
          <el-option label="客户合同签约与验厂" value="客户合同签约与验厂" />
          <el-option label="政府/行业申报" value="政府/行业申报" />
          <el-option label="外部查验与年检" value="外部查验与年检" />
          <el-option label="其它正当业务" value="其它正当业务" />
        </el-select>
      </el-form-item>

      <el-form-item label="领用用途说明" required>
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请详细说明领用用途（如：用于乐龄家大健康XX市中心医疗设备招投标）"
        />
      </el-form-item>

      <el-form-item label="使用期限">
        <el-radio-group v-model="form.duration">
          <el-radio-button label="1天" />
          <el-radio-button label="3天" />
          <el-radio-button label="7天" />
        </el-radio-group>
      </el-form-item>

      <el-form-item label="加盖专用水印">
        <el-switch v-model="form.needWatermark" />
        <span class="form-sub-tip">（建议开启，审批通过后自动在导出的文件上合成用途水印）</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交审批
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-sub-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
