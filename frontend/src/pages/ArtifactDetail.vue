<template>
  <section v-if="artifact" class="detail-page">
    <div class="page-head">
      <div>
        <h1>{{ artifact.name }}</h1>
        <p>独立模型查看器支持 360° 旋转、缩放和标注定位，适合讲解工艺细节。</p>
      </div>
      <RouterLink class="back-link" to="/">返回展厅</RouterLink>
    </div>

    <div class="detail-grid">
      <ModelViewer :artifact="artifact" :annotations="annotations" @annotation-select="selectedAnnotationId = $event" />
      <div class="detail-side">
        <InfoPanel :artifact="artifact" :annotations="annotations" @annotation-click="selectedAnnotationId = $event" />
        <section class="panel-surface annotation-editor">
          <header>
            <h3>添加 3D 标注</h3>
            <small>坐标以模型中心为原点</small>
          </header>
          <div class="axis-grid">
            <n-input-number v-model:value="draft.position.x" size="small" :step="0.1" placeholder="X" />
            <n-input-number v-model:value="draft.position.y" size="small" :step="0.1" placeholder="Y" />
            <n-input-number v-model:value="draft.position.z" size="small" :step="0.1" placeholder="Z" />
          </div>
          <n-input v-model:value="draft.title" placeholder="标注标题" />
          <n-input v-model:value="draft.content" type="textarea" placeholder="讲解内容" :autosize="{ minRows: 3, maxRows: 5 }" />
          <n-select v-model:value="draft.iconType" :options="iconOptions" />
          <n-button type="primary" @click="addAnnotation">保存标注</n-button>
          <n-alert v-if="selectedAnnotation" type="info" :bordered="false">
            当前选中：{{ selectedAnnotation.title }}
            <template #action>
              <n-button quaternary type="error" size="small" @click="annotationStore.deleteAnnotation(selectedAnnotation.id)">
                删除
              </n-button>
            </template>
          </n-alert>
        </section>

        <section class="panel-surface feedback-admin">
          <header>
            <h3>讲解反馈</h3>
            <n-tag v-if="pendingFeedbacks.length" type="warning" size="small" round>
              {{ pendingFeedbacks.length }} 条待处理
            </n-tag>
            <n-tag v-else type="success" size="small" round>已全部处理</n-tag>
          </header>
          <p v-if="!annotations.length" class="feedback-empty">该展品暂无讲解，添加 3D 标注后即可收集参观者反馈。</p>
          <p v-else-if="!artifactFeedbacks.length" class="feedback-empty">还没有参观者提交反馈。</p>
          <div v-for="feedback in sortedFeedbacks" :key="feedback.id" class="feedback-item" :class="feedback.status">
            <div class="feedback-item-head">
              <n-tag :type="feedback.status === 'pending' ? 'warning' : 'success'" size="small">
                {{ feedback.status === 'pending' ? '待处理' : '已处理' }}
              </n-tag>
              <strong>{{ annotationTitleMap[feedback.targetId] ?? '已删除的讲解' }}</strong>
              <small>{{ formatDateTime(feedback.updatedAt) }}</small>
            </div>
            <p class="feedback-question">问题：{{ feedback.question }}</p>
            <div class="reply-row">
              <n-input
                :value="replyDrafts[feedback.id] ?? ''"
                type="textarea"
                size="small"
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="逐条回复参观者的问题"
                @update:value="setReplyDraft(feedback.id, $event)"
              />
              <n-button
                size="small"
                type="primary"
                :disabled="!(replyDrafts[feedback.id] ?? '').trim()"
                @click="resolveFeedback(feedback.id)"
              >
                {{ feedback.status === 'pending' ? '回复并标记已处理' : '更新回复' }}
              </n-button>
            </div>
            <p v-if="feedback.reply" class="feedback-reply">
              当前答复{{ feedback.repliedAt ? `（${formatDateTime(feedback.repliedAt)}）` : '' }}：{{ feedback.reply }}
            </p>
          </div>
        </section>
      </div>
    </div>
  </section>
  <n-result v-else status="404" title="展品不存在" description="请在展品库中选择已有展品。" />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import InfoPanel from '@/components/common/InfoPanel.vue';
import ModelViewer from '@/components/viewer/ModelViewer.vue';
import { useAnnotationStore } from '@/stores/annotation';
import { useArtifactStore } from '@/stores/artifact';
import { useFeedbackStore } from '@/stores/feedback';
import type { AnnotationDraft, AnnotationIcon, Feedback } from '@/types';
import { formatDateTime } from '@/utils/format';

const route = useRoute();
const message = useMessage();
const artifactStore = useArtifactStore();
const annotationStore = useAnnotationStore();
const feedbackStore = useFeedbackStore();
const selectedAnnotationId = ref('');
const replyDrafts = reactive<Record<string, string>>({});

const artifact = computed(() => artifactStore.getById(String(route.params.id ?? '')));
const annotations = computed(() => (artifact.value ? annotationStore.byArtifactId(artifact.value.id) : []));
const selectedAnnotation = computed(() => annotations.value.find((annotation) => annotation.id === selectedAnnotationId.value));

const artifactFeedbacks = computed<Feedback[]>(() =>
  artifact.value ? feedbackStore.byArtifactId(artifact.value.id) : []
);
const pendingFeedbacks = computed<Feedback[]>(() =>
  artifactFeedbacks.value.filter((feedback) => feedback.status === 'pending')
);
// 待处理问题排前面，同组内按最近更新倒序，便于逐条处理
const sortedFeedbacks = computed<Feedback[]>(() =>
  [...artifactFeedbacks.value].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  })
);
const annotationTitleMap = computed<Record<string, string>>(() =>
  Object.fromEntries(annotations.value.map((annotation) => [annotation.id, annotation.title]))
);

// 已处理反馈进入页面时回显已有答复，待处理反馈保持空白等待回复
watch(
  artifactFeedbacks,
  (feedbacks) => {
    feedbacks.forEach((feedback) => {
      if (!(feedback.id in replyDrafts) && feedback.reply) {
        replyDrafts[feedback.id] = feedback.reply;
      }
    });
  },
  { immediate: true }
);

function setReplyDraft(id: string, value: string) {
  replyDrafts[id] = value;
}

async function resolveFeedback(id: string) {
  const current = artifactFeedbacks.value.find((feedback) => feedback.id === id);
  const reply = (replyDrafts[id] ?? current?.reply ?? '').trim();
  if (!reply) {
    message.warning('请先填写回复内容');
    return;
  }
  await feedbackStore.resolve(id, reply);
  replyDrafts[id] = reply;
  message.success('已回复并标记为已处理，参观者可在讲解下方看到答复');
}

const draft = reactive<AnnotationDraft>({
  artifactId: '',
  position: { x: 0.1, y: 0.2, z: 0.35 },
  title: '',
  content: '',
  iconType: 'detail'
});

const iconOptions: { label: string; value: AnnotationIcon }[] = [
  { label: '细节', value: 'detail' },
  { label: '材质', value: 'material' },
  { label: '历史', value: 'history' },
  { label: '工艺', value: 'technique' }
];

async function addAnnotation() {
  if (!artifact.value || !draft.title.trim()) {
    message.warning('请填写标注标题');
    return;
  }
  await annotationStore.addAnnotation({
    artifactId: artifact.value.id,
    position: { ...draft.position },
    title: draft.title,
    content: draft.content,
    iconType: draft.iconType
  });
  draft.title = '';
  draft.content = '';
  message.success('标注已保存到 IndexedDB');
}
</script>

<style scoped>
.detail-page {
  display: grid;
  gap: 20px;
}

.back-link {
  padding: 10px 14px;
  color: #fbf5e8;
  text-decoration: none;
  background: var(--museum-green);
  border-radius: 6px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.55fr);
  gap: 18px;
  align-items: start;
}

.detail-side {
  display: grid;
  gap: 14px;
}

.annotation-editor {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.annotation-editor header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.annotation-editor h3,
.annotation-editor small {
  margin: 0;
}

.annotation-editor small {
  color: rgba(31, 46, 41, 0.6);
}

.axis-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.feedback-admin {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.feedback-admin header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-admin header h3 {
  margin: 0;
}

.feedback-empty {
  margin: 0;
  color: rgba(31, 46, 41, 0.55);
  font-size: 13px;
}

.feedback-item {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: #f3ecd9;
  border: 1px solid rgba(23, 63, 53, 0.14);
  border-radius: 6px;
}

.feedback-item.resolved {
  background: rgba(79, 119, 109, 0.08);
}

.feedback-item-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.feedback-item-head strong {
  color: var(--museum-ink);
  font-size: 14px;
}

.feedback-item-head small {
  margin-left: auto;
  color: rgba(31, 46, 41, 0.45);
  font-size: 12px;
}

.feedback-question {
  margin: 0;
  color: rgba(31, 46, 41, 0.82);
  font-size: 13.5px;
  line-height: 1.55;
  word-break: break-word;
}

.reply-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: end;
}

.feedback-reply {
  margin: 0;
  padding: 8px 10px;
  color: var(--museum-ink);
  font-size: 13px;
  line-height: 1.5;
  background: rgba(23, 63, 53, 0.08);
  border-radius: 6px;
}

@media (max-width: 720px) {
  .reply-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
