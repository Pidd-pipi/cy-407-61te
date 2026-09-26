export type FeedbackKind = 'useful' | 'issue';

export type FeedbackStatus = 'pending' | 'resolved';

export type FeedbackTargetType = 'annotation';

export interface Feedback {
  /** 由 targetId 与 deviceId 组合而成，保证同一台设备对同一条讲解只有一条记录 */
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  artifactId: string;
  deviceId: string;
  kind: FeedbackKind;
  /** kind 为 issue 时参观者填写的问题内容 */
  question: string;
  /** 策展人回复 */
  reply: string;
  /** issue 初始为 pending，回复后置为 resolved；useful 无需处理，直接 resolved */
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

export type FeedbackDraft = Pick<Feedback, 'targetType' | 'targetId' | 'artifactId' | 'deviceId' | 'kind' | 'question'>;
