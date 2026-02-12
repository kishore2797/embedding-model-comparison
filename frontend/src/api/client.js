import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchModels = () => api.get('/models').then(r => r.data);
export const validateModels = (model_ids) => api.post('/models/validate', { model_ids }).then(r => r.data);

export const fetchDatasets = () => api.get('/datasets').then(r => r.data);
export const fetchDataset = (id) => api.get(`/datasets/${id}`).then(r => r.data);

export const startBenchmark = (params) => api.post('/benchmark/run', params).then(r => r.data);
export const getBenchmarkStatus = (runId) => api.get(`/benchmark/status/${runId}`).then(r => r.data);
export const cancelBenchmark = (runId) => api.post(`/benchmark/cancel/${runId}`).then(r => r.data);

export const getResults = (runId) => api.get(`/results/${runId}`).then(r => r.data);
export const getEmbeddingQuality = (runId) => api.get(`/results/${runId}/embeddings`).then(r => r.data);
export const getUmapCoords = (runId, modelId) => api.get(`/results/${runId}/umap`, { params: { model_id: modelId } }).then(r => r.data);

export const liveQuery = (params) => api.post('/explore/query', params).then(r => r.data);
export const computeSimilarity = (params) => api.post('/explore/similarity', params).then(r => r.data);

export const fetchHealth = () => api.get('/health').then(r => r.data);

export default api;
