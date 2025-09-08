import api from './axios';
import type { JourneyStep } from './journeys';

export interface Template {
  name: string;
  description: string;
  steps: JourneyStep[];
}

export const getTemplates = async (): Promise<Template[]> => {
  const response = await api.get('/api/templates');
  return response.data;
};
