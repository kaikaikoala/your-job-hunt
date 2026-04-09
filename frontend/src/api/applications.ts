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
  referrerId?: string;
  latestStage?: LatestStage;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  jobPostingUrl?: string;
  salaryRange?: string;
  initialStage?: string;
  stageDate?: string;
  referrerId?: string;
}

export interface Stage {
  appStageId: string;
  stage: string;
  stageDate?: string;
  result?: string;
  createdAt: string;
}

export interface ApplicationWithStages extends Application {
  stages: Stage[];
}

export interface DashboardData {
  applications: ApplicationWithStages[];
}

export const fetchApplications = (): Promise<Application[]> =>
  axiosInstance.get('/applications').then((r) => r.data);

export const fetchDashboard = (): Promise<DashboardData> =>
  axiosInstance.get('/applications/dashboard').then((r) => r.data);

export const fetchApplication = (id: string): Promise<Application> =>
  axiosInstance.get(`/applications/${id}`).then((r) => r.data);

export interface PatchApplicationInput {
  company?: string;
  role?: string;
  jobPostingUrl?: string | null;
  salaryRange?: string | null;
  referrerId?: string | null;
  clearReferrer?: boolean;
}

export const createApplication = (input: CreateApplicationInput): Promise<Application> =>
  axiosInstance.post('/applications', input).then((r) => r.data);

export const updateApplication = (id: string, input: PatchApplicationInput): Promise<Application> =>
  axiosInstance.patch(`/applications/${id}`, input).then((r) => r.data);

export const deleteApplication = (id: string): Promise<void> =>
  axiosInstance.delete(`/applications/${id}`).then(() => undefined);
