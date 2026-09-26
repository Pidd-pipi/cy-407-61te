<template>
  <section class="panel-surface pending-feedback">
    <header>
      <h3>待处理问题</h3>
      <n-tag v-if="pending.length" type="warning" size="small" :bordered="false">
        {{ pending.length }} 条待处理
      </n-tag>
      <n-tag v-else type="success" size="small" :bordered="false">全部处理完毕</n-tag>
    </header>

    <n-empty v-if="!pending.length" size="small" description="暂无参观者提交的讲解问题" />

    <article v-for="item in pending" :key="item.id" class="pending-item">
      <div class="pending-meta">
        <strong>关于讲解：{{ annotationTitle(item.annotationId) }}</strong>
        <time>{{ formatTime(item.updatedAt) }}</time>
      </div>
      <p class="pending-content">{{ item.content }}</p>
      <n-input
        v-model:value="drafts[item.id]"
        type="textarea"
        size="small"
        :autosize="{ minRows: 2, maxRows: 5 }"
        placeholder="逐条回复参观者，提交后对方可在讲解旁看到答复"
      />
      <div class="pending-actions">
        <n-button size="small" type="primary" @click="resolve(item.id)">回复并标记已处理</n-button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useMessage } from 'naive-ui';
import { useAnnotationStore } from '@/stores/annotation';
import { useFeedbackStore } from '@/stores/feedback';

const props = defineProps<{
  artifactId: string;
}>();

const message = useMessage();
const feedbackStore = useFeedbackStore();
const annotationStore = useAnnotationStore();
const drafts = reactive<Record<string, string>>({});

const pending = computed(() =>
  [...feedbackStore.pendingIssuesByArtifactId(props.artifactId)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )
);

function annotationTitle(annotationId: string): string {
  return annotationStore.annotations.find((annotation) => annotation.id === annotationId)?.title ?? '该讲解已删除';
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function resolve(id: string) {
  if (!(drafts[id] ?? '').trim()) {
    message.warning('请先填写回复内容');
    return;
  }
  await feedbackStore.resolveFeedback(id, drafts[id]);
  delete drafts[id];
  message.success('已回复并标记为已处理');
}
</script>

<style scoped>
.pending-feedback {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.pending-feedback header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pending-feedback h3 {
  margin: 0;
}

.pending-item {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: #efe5d1;
  border: 1px solid rgba(157, 123, 54, 0.3);
  border-radius: 6px;
}

.pending-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.pending-meta strong {
  font-size: 14px;
}

.pending-meta time {
  flex: 0 0 auto;
  color: rgba(31, 46, 41, 0.55);
  font-size: 12px;
}

.pending-content {
  margin: 0;
  color: var(--museum-ink);
  line-height: 1.6;
}

.pending-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
