const DEVICE_ID_KEY = 'craft-gallery-device-id';

/**
 * 为当前浏览器生成并持久化一个设备标识。
 * 参观者无需登录，同一台设备对同一条讲解只保留一条反馈。
 */
export function getDeviceId(): string {
  try {
    const existed = localStorage.getItem(DEVICE_ID_KEY);
    if (existed) return existed;

    const randomPart = crypto.getRandomValues(new Uint32Array(3)).join('');
    const deviceId = `device-${Date.now().toString(36)}-${randomPart}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    // localStorage 不可用时退化为会话级标识
    return `device-session-${Date.now().toString(36)}`;
  }
}
