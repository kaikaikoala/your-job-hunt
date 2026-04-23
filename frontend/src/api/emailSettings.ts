import axiosInstance from './axiosInstance';

export interface EmailSettings {
  email: string;
  label?: string;
}

export interface EmailSyncStatus {
  syncId: string;
  status: string;
}

export const fetchEmailSettings = (): Promise<EmailSettings | null> =>
  axiosInstance.get('/email-settings').then((r) => r.data).catch((err) => {
    if (err.response?.status === 404) return null;
    throw err;
  });

export const createEmailSettings = (code: string, redirectUri: string, codeVerifier: string): Promise<EmailSettings> =>
  axiosInstance.post('/email-settings', { code, redirectUri, codeVerifier }).then((r) => r.data);

export const updateEmailSettings = (label: string): Promise<EmailSettings> =>
  axiosInstance.patch('/email-settings', { label }).then((r) => r.data);

export const deleteEmailSettings = (): Promise<void> =>
  axiosInstance.delete('/email-settings').then(() => undefined);

export const startEmailSync = (): Promise<EmailSyncStatus> =>
  axiosInstance.post('/email-syncs').then((r) => r.data);

export const fetchEmailSync = (syncId: string): Promise<EmailSyncStatus> =>
  axiosInstance.get(`/email-syncs/${syncId}`).then((r) => r.data);
