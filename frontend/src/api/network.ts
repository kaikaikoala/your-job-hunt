import axiosInstance from './axiosInstance';

export interface NetworkContact {
  referrerId: string;
  name: string;
  type?: string;
  linkedAppCount: number;
}

export interface CreateNetworkInput {
  name: string;
  type?: string;
}

export const fetchContacts = (): Promise<NetworkContact[]> =>
  axiosInstance.get('/network').then((r) => r.data);

export const fetchContact = (id: string): Promise<NetworkContact> =>
  axiosInstance.get(`/network/${id}`).then((r) => r.data);

export const createContact = (input: CreateNetworkInput): Promise<NetworkContact> =>
  axiosInstance.post('/network', input).then((r) => r.data);

export const updateContact = (id: string, input: CreateNetworkInput): Promise<NetworkContact> =>
  axiosInstance.put(`/network/${id}`, input).then((r) => r.data);

export const deleteContact = (id: string): Promise<void> =>
  axiosInstance.delete(`/network/${id}`).then(() => undefined);
