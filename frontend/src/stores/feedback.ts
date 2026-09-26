import { defineStore } from 'pinia';
import { feedbackRepository } from '@/api/storage';
import type { Feedback, FeedbackDraft } from '@/types';
import { getDeviceId } from '@/utils/device';

function buildFeedbackId(targetId: string, deviceId: string): string {
  return `feedback-${targetId}-${deviceId}`;
}

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbacks: [] as Feedback[],
    loaded: false
  }),
  getters: {
    /** 当前设备对某条讲解提交的最新反馈（每台设备每条讲解只有一条） */
    mine: (state) => (targetId: string) =>
      state.feedbacks.find((feedback) => feedback.targetId === targetId && feedback.deviceId === getDeviceId()),
    byArtifactId: (state) => (artifactId: string) =>
      state.feedbacks.filter((feedback) => feedback.artifactId === artifactId),
    pendingByArtifactId: (state) => (artifactId: string) =>
      state.feedbacks.filter((feedback) => feedback.artifactId === artifactId && feedback.status === 'pending'),
    totalPending: (state) => state.feedbacks.filter((feedback) => feedback.status === 'pending').length
  },
  actions: {
    async load() {
      this.feedbacks = await feedbackRepository.list();
      this.loaded = true;
    },
    /**
     * 参观者提交反馈。同一台设备对同一条讲解重复提交时，
     * 只更新原有记录（内容、类型、时间），并清空上一轮的处理状态与回复。
     */
    async submit(draft: FeedbackDraft): Promise<Feedback> {
      const now = new Date().toISOString();
      const id = buildFeedbackId(draft.targetId, draft.deviceId);
      const existing = this.feedbacks.find((feedback) => feedback.id === id);
      const feedback: Feedback = {
        ...(existing ?? {}),
        id,
        targetType: draft.targetType,
        targetId: draft.targetId,
        artifactId: draft.artifactId,
        deviceId: draft.deviceId,
        kind: draft.kind,
        question: draft.question,
        reply: '',
        repliedAt: undefined,
        status: draft.kind === 'issue' ? 'pending' : 'resolved',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      this.feedbacks = this.feedbacks.some((item) => item.id === id)
        ? this.feedbacks.map((item) => (item.id === id ? feedback : item))
        : [...this.feedbacks, feedback];
      await feedbackRepository.save(feedback);
      return feedback;
    },
    /** 策展人逐条回复并标记已处理，参观者随后可看到答复 */
    async resolve(id: string, reply: string) {
      const current = this.feedbacks.find((feedback) => feedback.id === id);
      if (!current) return;
      const now = new Date().toISOString();
      const updated: Feedback = {
        ...current,
        reply,
        status: 'resolved',
        repliedAt: now,
        updatedAt: now
      };
      this.feedbacks = this.feedbacks.map((feedback) => (feedback.id === id ? updated : feedback));
      await feedbackRepository.save(updated);
    },
    /** 展品从库中移除时，清理该展品下全部讲解的反馈 */
    async removeByArtifact(artifactId: string) {
      const matched = this.feedbacks.filter((feedback) => feedback.artifactId === artifactId);
      if (matched.length === 0) return;
      this.feedbacks = this.feedbacks.filter((feedback) => feedback.artifactId !== artifactId);
      await feedbackRepository.removeMany(matched.map((feedback) => feedback.id));
    },
    /** 讲解（标注）被删除时清理对应反馈 */
    async removeByTarget(targetId: string) {
      const matched = this.feedbacks.filter((feedback) => feedback.targetId === targetId);
      if (matched.length === 0) return;
      this.feedbacks = this.feedbacks.filter((feedback) => feedback.targetId !== targetId);
      await feedbackRepository.removeMany(matched.map((feedback) => feedback.id));
    }
  }
});
