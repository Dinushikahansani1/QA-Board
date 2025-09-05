import axios from './axios';

export interface Template {
  name: string;
  description: string;
  steps: any[]; // You might want to define a more specific type for steps
}

export const getTemplates = async (): Promise<Template[]> => {
  const response = await axios.get('/api/templates');
  return response.data;
};
