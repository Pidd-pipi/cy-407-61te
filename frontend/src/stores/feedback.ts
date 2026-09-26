import { defineStore } from 'pinia';
import { feedbackRepository } from '@/api/storage';
import type { AnnotationFeedback, FeedbackType } from '@/types';
import { createId } from '@/utils/storage';

const DEVICE_ID_KEY = 'craft-gallery-device-id';

function resolveDeviceId(): string {
  const cached = localStorage.getItem(DEVICE_ID_KEY);
  if (cached) return cached;
  const created = createId('device');
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbacks: [] as AnnotationFeedback[],
    deviceId: '',
    loaded: false
  }),
  getters: {
    byArtifactId: (state) => (artifactId: string) =>
      state.feedbacks.filter((feedback) => feedback.artifactId === artifactId),
    pendingIssuesByArtifactId: (state) => (artifactId: string) =>
      state.feedbacks.filter(
        (feedback) => feedback.artifactId === artifactId && feedback.type === 'issue' && feedback.status === 'pending'
      ),
    /** 本机在某条讲解上的最新反馈（同一设备只保留一条） */
    mineForAnnotation: (state) => (annotationId: string) =>
      state.feedbacks.find((feedback) => feedback.annotationId === annotationId && feedback.deviceId === state.deviceId)
  },
  actions: {
    async load() {
      this.deviceId = resolveDeviceId();
      this.feedbacks = await feedbackRepository.list();
      this.loaded = true;
    },
    /**
     * 提交反馈：同一台设备对同一条讲解只保留一条记录，
     * 重复提交（含 useful/issue 之间切换）只更新原记录。
     * 重新提交问题会回到待处理状态，并清空旧答复。
     */
    async submitFeedback(input: { annotationId: string; artifactId: string; type: FeedbackType; content?: string }) {
      const now = new Date().toISOString();
      const content = input.type === 'issue' ? (input.content ?? '').trim() : '';
      const existing = this.mineForAnnotation(input.annotationId);

      if (existing) {
        const updated: AnnotationFeedback = {
          ...existing,
          artifactId: input.artifactId,
          type: input.type,
          content,
          status: input.type === 'issue' ? 'pending' : 'resolved',
          reply: '',
          repliedAt: undefined,
          updatedAt: now
        };
        this.feedbacks = this.feedbacks.map((feedback) => (feedback.id === updated.id ? updated : feedback));
        await feedbackRepository.save(updated);
        return updated;
      }

      const feedback: AnnotationFeedback = {
        id: createId('feedback'),
        annotationId: input.annotationId,
        artifactId: input.artifactId,
        deviceId: this.deviceId,
        type: input.type,
        content,
        status: input.type === 'issue' ? 'pending' : 'resolved',
        reply: '',
        createdAt: now,
        updatedAt: now
      };
      this.feedbacks.push(feedback);
      await feedbackRepository.save(feedback);
      return feedback;
    },
    /** 策展人逐条回复并标记已处理，答复后参观者可见 */
    async resolveFeedback(id: string, reply: string) {
      const current = this.feedbacks.find((feedback) => feedback.id === id);
      if (!current) return;
      const now = new Date().toISOString();
      const updated: AnnotationFeedback = {
        ...current,
        reply: reply.trim(),
        status: 'resolved',
        repliedAt: now,
        updatedAt: now
      };
      this.feedbacks = this.feedbacks.map((feedback) => (feedback.id === id ? updated : feedback));
      await feedbackRepository.save(updated);
    },
    /** 展品从库中移除时，相关反馈一并清理 */
    async removeByArtifactId(artifactId: string) {
      const targets = this.feedbacks.filter((feedback) => feedback.artifactId === artifactId);
      if (targets.length === 0) return;
      this.feedbacks = this.feedbacks.filter((feedback) => feedback.artifactId !== artifactId);
      await Promise.all(targets.map((feedback) => feedbackRepository.remove(feedback.id)));
    },
    /** 讲解（标注）被删除时，其反馈也一并清理 */
    async removeByAnnotationId(annotationId: string) {
      const targets = this.feedbacks.filter((feedback) => feedback.annotationId === annotationId);
      if (targets.length === 0) return;
      this.feedbacks = this.feedbacks.filter((feedback) => feedback.annotationId !== annotationId);
      await Promise.all(targets.map((feedback) => feedbackRepository.remove(feedback.id)));
    }
  }
});
