import api from './axios';

// This selector type can be a simple string (for manual journeys)
// or a structured object (for imported/recorded journeys)
type Selector = string | { method: string; args: any[] };

export interface JourneyStep {
  action: 'goto' | 'click' | 'type' | 'waitForSelector' | 'toBeVisible' | 'toHaveText' | 'toHaveAttribute';
  params: {
    selector?: Selector;
    url?: string;
    text?: string;
    attribute?: string;
    value?: string;
    not?: boolean;
  };
}

export interface TestResult {
  _id: string;
  journey: string;
  status: 'success' | 'failure';
  logs: string;
  screenshot?: string;
  createdAt: string;
}

export interface Journey {
  _id: string;
  name: string;
  domain: string;
  steps: JourneyStep[];
  code?: string;
  user: string;
  lastRun?: {
    status: 'success' | 'failure' | 'pending';
    runAt: string;
    testResult?: TestResult;
  };
  createdAt: string;
  updatedAt: string;
}

export const getJourneys = async (): Promise<Journey[]> => {
  const response = await api.get('/api/journeys');
  return response.data;
};

export const getJourney = async (id: string): Promise<Journey> => {
  const response = await api.get(`/api/journeys/${id}`);
  return response.data;
};

export const createJourney = async (data: { name: string; domain: string; steps: JourneyStep[] }): Promise<Journey> => {
  const response = await api.post('/api/journeys', data);
  return response.data;
};

export const updateJourney = async (id: string, data: { name: string; domain?: string; steps?: JourneyStep[], code?: string }): Promise<Journey> => {
  const response = await api.put(`/api/journeys/${id}`, data);
  return response.data;
};

export const deleteJourney = async (id: string): Promise<void> => {
  await api.delete(`/api/journeys/${id}`);
};

export const runJourney = async (id: string): Promise<{ message: string }> => {
  const response = await api.post(`/api/journeys/${id}/run`);
  return response.data;
};

export const generateJourneyFromText = async (text: string): Promise<{ name: string; steps: JourneyStep[] }> => {
  const response = await api.post('/api/journeys/generate-from-text', { text });
  return response.data;
};

export const importJourney = async (name: string, code: string): Promise<Journey> => {
  const response = await api.post('/api/import/journey', { name, code });
  return response.data;
};

export interface NotificationSettings {
  failureThreshold: number;
  emails: string[];
  slackWebhookUrl: string;
}

export const getNotificationSettings = async (journeyId: string): Promise<NotificationSettings> => {
  const response = await api.get(`/api/notification-settings/${journeyId}`);
  return response.data;
};

export const updateNotificationSettings = async (journeyId: string, data: NotificationSettings): Promise<NotificationSettings> => {
  const response = await api.put(`/api/notification-settings/${journeyId}`, data);
  return response.data;
};
