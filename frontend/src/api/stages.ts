import axiosInstance from './axiosInstance';

export interface Stage {
  appStageId: string;
  appId: string;
  stage: string;
  stageDate?: string;
  result?: string;
}

export interface CreateStageInput {
  stage: string;
  stageDate?: string;
  result?: string;
}

export interface PatchStageInput {
  stage?: string;
  stageDate?: string;
  result?: string;
}

export const fetchStages = (appId: string): Promise<Stage[]> =>
  axiosInstance.get(`/applications/${appId}/stages`).then((r) => r.data);

export const createStage = (appId: string, input: CreateStageInput): Promise<Stage> =>
  axiosInstance.post(`/applications/${appId}/stages`, input).then((r) => r.data);

export const updateStage = (appId: string, stageId: string, input: PatchStageInput): Promise<Stage> =>
  axiosInstance.patch(`/applications/${appId}/stages/${stageId}`, input).then((r) => r.data);

export const deleteStage = (appId: string, stageId: string): Promise<void> =>
  axiosInstance.delete(`/applications/${appId}/stages/${stageId}`).then(() => undefined);
