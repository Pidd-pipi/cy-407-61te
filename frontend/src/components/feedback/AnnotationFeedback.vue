<template>
  <div class="annotation-feedback" @click.stop>
    <div v-if="mine && mine.type === 'issue'" class="feedback-state issue" :class="mine.status">
      <p class="state-question"><strong>我反馈的问题：</strong>{{ mine.content }}</p>
      <n-tag :type="mine.status === 'pending' ? 'warning' : 'success'" size="small" :bordered="false">
        {{ feedbackStatusLabels[mine.status] }}
      </n-tag>
      <p v-if="mine.reply" class="state-reply">
        <strong>策展人回复：</strong>{{ mine.reply }}
      </p>
    </div>
    <div v-else-if="mine" class="feedback-state useful">
      <span>已确认这条讲解有用，谢谢</span>
    </div>

    <div v-if="!editing" class="feedback-actions">
      <n-button size="tiny" secondary :type="mine?.type === 'useful' ? 'success' : 'default'" @click="confirmUseful">
        有用
      </n-button>
      <n-button
        size="tiny"
        secondary
        :type="mine?.type === 'issue' ? 'warning' : 'default'"
        @click="startEdit"
      >
        {{ mine?.type === 'issue' ? '修改问题' : '内容有误' }}
      </n-button>
    </div>

    <div v-else class="feedback-form">
      <n-input
        v-model:value="issueText"
        type="textarea"
        size="small"
        :autosize="{ minRows: 2, maxRows: 4 }"
        placeholder="说明哪里有误或有疑问，提交后策展人会逐条处理"
      />
      <div class="form-buttons">
        <n-button size="tiny" type="primary" @click="submitIssue">提交问题</n-button>
        <n-button size="tiny" quaternary @click="editing = false">取消</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useFeedbackStore } from '@/stores/feedback';
import type { Annotation } from '@/types';
import { feedbackStatusLabels } from '@/types';

const props = defineProps<{
  annotation: Annotation;
}>();

const message = useMessage();
const feedbackStore = useFeedbackStore();
const editing = ref(false);
const issueText = ref('');

const mine = computed(() => feedbackStore.mineForAnnotation(props.annotation.id));

async function confirmUseful() {
  await feedbackStore.submitFeedback({
    annotationId: props.annotation.id,
    artifactId: props.annotation.artifactId,
    type: 'useful'
  });
  editing.value = false;
  message.success('已确认讲解有用');
}

function startEdit() {
  issueText.value = mine.value?.type === 'issue' ? mine.value.content : '';
  editing.value = true;
}

async function submitIssue() {
  if (!issueText.value.trim()) {
    message.warning('请先描述发现的问题');
    return;
  }
  await feedbackStore.submitFeedback({
    annotationId: props.annotation.id,
    artifactId: props.annotation.artifactId,
    type: 'issue',
    content: issueText.value
  });
  editing.value = false;
  message.success('问题已提交，策展人将在展品详情中回复');
}
</script>

<style scoped>
.annotation-feedback {
  display: grid;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(23, 63, 53, 0.16);
}

.feedback-state {
  display: grid;
  gap: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(31, 46, 41, 0.72);
}

.feedback-state.useful {
  color: var(--museum-green);
  font-weight: 700;
}

.state-question,
.state-reply {
  margin: 0;
}

.state-reply {
  padding: 6px 8px;
  color: var(--museum-ink);
  background: rgba(79, 119, 109, 0.12);
  border-radius: 4px;
}

.feedback-actions {
  display: flex;
  gap: 6px;
}

.feedback-form {
  display: grid;
  gap: 6px;
}

.form-buttons {
  display: flex;
  gap: 6px;
}
</style>
