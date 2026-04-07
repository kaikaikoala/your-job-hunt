import axiosInstance from './axiosInstance';

export interface LatestStage {
  stage: string;
  stageDate?: string;
  result?: string;
}

export interface Application {
  appId: string;
  company: string;
  role: string;
  jobPostingUrl?: string;
  salaryRange?: string;
  latestStage?: LatestStage;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  jobPostingUrl?: string;
  salaryRange?: string;
  initialStage?: string;
  stageDate?: string;
}

export const fetchApplications = (): Promise<Application[]> =>
  axiosInstance.get('/applications').then((r) => r.data);

export const fetchApplication = (id: string): Promise<Application> =>
  axiosInstance.get(`/applications/${id}`).then((r) => r.data);

export const createApplication = (input: CreateApplicationInput): Promise<Application> =>
  axiosInstance.post('/applications', input).then((r) => r.data);
