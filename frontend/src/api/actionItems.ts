import axiosInstance from './axiosInstance';

export interface ActionItem {
  actionItemId: string;
  userId: string;
  appId?: string;
  referrerId?: string;
  description: string;
  status: string;
  dueDate?: string;
  createDate: string;
}

export interface CreateActionItemInput {
  description: string;
  appId?: string;
  referrerId?: string;
  dueDate?: string;
}

export interface PatchActionItemInput {
  description?: string;
  status?: string;
  dueDate?: string;
}

export const fetchActionItems = (filters?: {
  appId?: string;
  referrerId?: string;
  status?: string;
}): Promise<ActionItem[]> => {
  const params = new URLSearchParams();
  if (filters?.appId) params.set('appId', filters.appId);
  if (filters?.referrerId) params.set('referrerId', filters.referrerId);
  if (filters?.status) params.set('status', filters.status);
  const query = params.toString();
  return axiosInstance.get(`/action-items${query ? `?${query}` : ''}`).then((r) => r.data);
};

export const createActionItem = (input: CreateActionItemInput): Promise<ActionItem> =>
  axiosInstance.post('/action-items', input).then((r) => r.data);

export const updateActionItem = (id: string, input: PatchActionItemInput): Promise<ActionItem> =>
  axiosInstance.patch(`/action-items/${id}`, input).then((r) => r.data);

export const deleteActionItem = (id: string): Promise<void> =>
  axiosInstance.delete(`/action-items/${id}`).then(() => undefined);
