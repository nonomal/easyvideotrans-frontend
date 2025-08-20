import axios from 'axios';
import { REQUEST_ENUM } from '@/app/const/request';
import { IGenerateTTSProp, ITranslateSrtIProp } from '@/app/type';

export const handleDownloadVideo = (video_id: string) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.downloadVideo,
    { video_id },
  );
};

export const handleDownloadVideoThumbnail = async (
  video_id: string,
): Promise<string> => {
  try {
    const response = await axios.post(
      REQUEST_ENUM.downloadVideoThumbnail,
      { video_id },
      { responseType: 'blob' },
    );
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('Failed to download video thumbnail:', error);
    throw error;
  }
};

export const handleExtractAudio = (video_id: string) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.extractAudio,
    { video_id },
  );
};
export const voiceAudioConnect = (video_id: string) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.voiceConnect,
    { video_id },
  );
};
export const videoPreview = (video_id: string) => {
  return axios.post<{
    queue_length: any;
    video_preview_task_id: string;
    message: string;
  }>(REQUEST_ENUM.videoPreview, { video_id });
};

export const videoPreviewStatus = (task_id: string) => {
  return axios.get<{ state: string; status: string }>(
    REQUEST_ENUM.videoPreviewStatus + '/' + task_id,
  );
};

export const removeAudioBg = (video_id: string) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.removeAudioBg,
    { video_id },
  );
};
export const extractSourceSrt = (video_id: string) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.extractSourceSrt,
    { video_id },
  );
};

export const translateSrt = (data: ITranslateSrtIProp) => {
  return axios.post<{ video_id: string; message: string }>(
    REQUEST_ENUM.translateSrt,
    data,
  );
};
export const generateTTS = (data: IGenerateTTSProp) => {
  // Transform the data to match backend expectations
  const requestData = {
    video_id: data.video_id,
    tts_vendor: data.tts_vendor,
    tts_character: data.tts_character,
    ...(data.tts_params && { tts_params: data.tts_params }),
  };
  
  return axios.post<{ video_id: string; message: string; duration?: number }>(
    REQUEST_ENUM.generateTTS,
    requestData,
  );
};

export const downloadSubtitles = async (video_id: string): Promise<string> => {
  try {
    const response = await axios.get(`/api/subtitles/${video_id}`, {
      responseType: 'text',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to download subtitles:', error);
    throw error;
  }
};

export const uploadSubtitles = (video_id: string, content: string) => {
  return axios.post<{ video_id: string; message: string }>(
    `/api/subtitles/${video_id}`,
    { content },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};
