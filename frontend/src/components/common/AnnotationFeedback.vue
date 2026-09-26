<template>
  <div class="annotation-feedback" @click.stop>
    <template v-if="!myFeedback">
      <div class="feedback-actions">
        <span class="feedback-label">这条讲解对你有帮助吗？</span>
        <button type="button" class="feedback-btn useful" @click="submitUseful">👍 有用</button>
        <button type="button" class="feedback-btn issue" :class="{ active: isReporting }" @click="toggleReport">
          ✎ 内容有误
        </button>
      </div>
      <div v-if="isReporting" class="feedback-form">
        <textarea v-model="question" rows="3" placeholder="请描述讲解中存疑或错误的地方，策展人会看到并回复" />
        <div class="form-footer">
          <button type="button" class="submit-btn" @click="submitIssue">提交问题</button>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-if="myFeedback.kind === 'useful'" class="feedback-state useful-state">
        <span>✓ 你已确认这条讲解有用，感谢反馈</span>
        <button type="button" class="change-btn" @click="startReport">发现有误？</button>
      </div>
      <div v-else class="feedback-state issue-state">
        <template v-if="myFeedback.status === 'pending'">
          <span class="state-head">⚠ 已提交问题，等待策展人回复</span>
          <p class="state-text">{{ myFeedback.question }}</p>
        </template>
        <template v-else>
          <span class="state-head">✓ 策展人已回复</span>
          <p class="state-text question">我的问题：{{ myFeedback.question }}</p>
          <p class="state-text reply">{{ myFeedback.reply }}</p>
          <small class="state-time" v-if="myFeedback.repliedAt">{{ formatDateTime(myFeedback.repliedAt) }}</small>
        </template>
        <div class="state-tools">
          <button type="button" class="change-btn" @click="usefulAgain">改为有用</button>
          <button type="button" class="change-btn" @click="startReport">更新问题</button>
        </div>
      </div>
      <div v-if="isReporting" class="feedback-form">
        <textarea v-model="question" rows="3" placeholder="请描述讲解中存疑或错误的地方，策展人会看到并回复" />
        <div class="form-footer">
          <button type="button" class="submit-btn" @click="submitIssue">更新问题</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useFeedbackStore } from '@/stores/feedback';
import type { Annotation } from '@/types';
import { getDeviceId } from '@/utils/device';
import { formatDateTime } from '@/utils/format';

const props = defineProps<{
  annotation: Annotation;
}>();

const message = useMessage();
const feedbackStore = useFeedbackStore();
const isReporting = ref(false);
const question = ref('');

const myFeedback = computed(() => feedbackStore.mine(props.annotation.id));

function toggleReport() {
  isReporting.value = !isReporting.value;
  if (isReporting.value) question.value = myFeedback.value?.kind === 'issue' ? myFeedback.value.question : '';
}

function startReport() {
  isReporting.value = true;
  question.value = myFeedback.value?.kind === 'issue' ? myFeedback.value.question : '';
}

async function submitUseful() {
  await feedbackStore.submit({
    targetType: 'annotation',
    targetId: props.annotation.id,
    artifactId: props.annotation.artifactId,
    deviceId: getDeviceId(),
    kind: 'useful',
    question: ''
  });
  isReporting.value = false;
  message.success('已确认讲解有用');
}

async function submitIssue() {
  if (!question.value.trim()) {
    message.warning('请先填写发现的问题');
    return;
  }
  await feedbackStore.submit({
    targetType: 'annotation',
    targetId: props.annotation.id,
    artifactId: props.annotation.artifactId,
    deviceId: getDeviceId(),
    kind: 'issue',
    question: question.value.trim()
  });
  isReporting.value = false;
  question.value = '';
  message.success('问题已提交，策展人回复后会在此显示');
}

async function usefulAgain() {
  await submitUseful();
}
</script>

<style scoped>
.annotation-feedback {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(23, 63, 53, 0.22);
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.feedback-label {
  width: 100%;
  color: rgba(31, 46, 41, 0.55);
  font-size: 12px;
}

.feedback-btn,
.change-btn,
.submit-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease;
}

.feedback-btn {
  color: var(--museum-ink);
  background: rgba(251, 245, 232, 0.7);
  border: 1px solid rgba(23, 63, 53, 0.25);
}

.feedback-btn:hover {
  border-color: var(--museum-green);
}

.feedback-btn.useful:hover {
  color: var(--museum-green);
  background: rgba(79, 119, 109, 0.12);
}

.feedback-btn.issue:hover,
.feedback-btn.issue.active {
  color: #bb4d3e;
  border-color: #bb4d3e;
  background: rgba(187, 77, 62, 0.1);
}

.feedback-form {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.feedback-form textarea {
  width: 100%;
  padding: 8px;
  resize: vertical;
  color: var(--museum-ink);
  font: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  background: #fbf5e8;
  border: 1px solid rgba(23, 63, 53, 0.25);
  border-radius: 6px;
}

.feedback-form textarea:focus {
  outline: none;
  border-color: var(--museum-green);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  color: #fbf5e8;
  background: var(--museum-green);
  border: 1px solid var(--museum-green);
}

.submit-btn:hover {
  background: #24594d;
}

.feedback-state {
  display: grid;
  gap: 4px;
  font-size: 12.5px;
  line-height: 1.5;
}

.useful-state {
  color: var(--museum-green);
}

.issue-state .state-head {
  font-weight: 700;
}

.issue-state .state-head:first-child {
  color: #9d7b36;
}

.state-text {
  margin: 0;
  color: rgba(31, 46, 41, 0.72);
  word-break: break-word;
}

.state-text.reply {
  padding: 6px 8px;
  color: var(--museum-ink);
  background: rgba(79, 119, 109, 0.1);
  border-radius: 6px;
}

.state-time {
  color: rgba(31, 46, 41, 0.45);
}

.state-tools {
  display: flex;
  gap: 8px;
}

.change-btn {
  padding: 2px 8px;
  color: rgba(31, 46, 41, 0.6);
  background: transparent;
  border: 1px solid transparent;
}

.change-btn:hover {
  color: var(--museum-green);
  background: rgba(23, 63, 53, 0.06);
}
</style>
