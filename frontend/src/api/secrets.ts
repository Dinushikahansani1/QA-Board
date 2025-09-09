import api from './axios';

export interface Secret {
  _id: string;
  name: string;
  createdAt: string;
}

export const getSecrets = async (): Promise<Secret[]> => {
  const response = await api.get('/api/secrets');
  return response.data;
};

export const createSecret = async (name: string, value: string): Promise<Secret> => {
  const response = await api.post('/api/secrets', { name, value });
  return response.data;
};

export const deleteSecret = async (id: string): Promise<void> => {
  await api.delete(`/api/secrets/${id}`);
};
