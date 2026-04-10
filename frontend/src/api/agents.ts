import axiosInstance from './axiosInstance';

export async function invokeHuntAgent(
  sid: string,
  message: string,
): Promise<{ response: string }> {
  const res = await axiosInstance.post<{ response: string }>(
    `/agents/hunt/${sid}/invoke`,
    { message },
  );
  return res.data;
}
