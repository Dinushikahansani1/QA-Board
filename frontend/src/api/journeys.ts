import api from './axios';

// Basic types for Journey data. These should match the backend models.
export interface JourneyStep {
  action: 'goto' | 'click' | 'type' | 'waitForSelector';
  params: {
    selector?: string;
    url?: string;
    text?: string;
  };
}

export interface Journey {
  _id: string;
  name: string;
  steps: JourneyStep[];
  user: string;
  lastRun?: {
    status: 'success' | 'failure' | 'pending';
    runAt: string;
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

export const createJourney = async (data: { name: string; steps: JourneyStep[] }): Promise<Journey> => {
  const response = await api.post('/api/journeys', data);
  return response.data;
};

export const updateJourney = async (id: string, data: { name: string; steps: JourneyStep[] }): Promise<Journey> => {
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
