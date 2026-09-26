export type FeedbackType = 'useful' | 'issue';

export type FeedbackStatus = 'pending' | 'resolved';

export interface AnnotationFeedback {
  id: string;
  /** 被反馈的讲解（标注）id */
  annotationId: string;
  /** 冗余展品 id，便于按展品统计待处理数量与级联清理 */
  artifactId: string;
  /** 提交设备标识，同一台设备对同一条讲解仅保留一条最新反馈 */
  deviceId: string;
  /** useful：讲解有用，直接确认；issue：发现内容有误 */
  type: FeedbackType;
  /** type 为 issue 时填写的问题描述 */
  content: string;
  /** pending：待策展人处理；resolved：已回复并标记处理 */
  status: FeedbackStatus;
  /** 策展人答复，答复后参观者可见 */
  reply: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  pending: '待处理',
  resolved: '已处理'
};
