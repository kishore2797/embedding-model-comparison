import { useState, useEffect } from 'react';
import { Loader2, Eye } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getUmapCoords } from '../api/client';

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const SHORT_NAME = (id) => id.split('/').pop();

export default function EmbeddingViz({ runId, modelIds }) {
  const [selectedModels, setSelectedModels] = useState([]);
  const [umapData, setUmapData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const toggleModel = async (modelId) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels((prev) => prev.filter((m) => m !== modelId));
      return;
    }

    if (selectedModels.length >= 4) return;
    setSelectedModels((prev) => [...prev, modelId]);

    if (!umapData[modelId]) {
      setLoading((prev) => ({ ...prev, [modelId]: true }));
      setError(null);
      try {
        const res = await getUmapCoords(runId, modelId);
        setUmapData((prev) => ({ ...prev, [modelId]: res.points }));
      } catch (err) {
        setError(`Failed to load UMAP for ${SHORT_NAME(modelId)}`);
        setSelectedModels((prev) => prev.filter((m) => m !== modelId));
      } finally {
        setLoading((prev) => ({ ...prev, [modelId]: false }));
      }
    }
  };

  if (!runId || !modelIds?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <Eye className="w-8 h-8 mx-auto mb-2" />
        <p>Complete a benchmark to visualize embeddings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Embedding Space (UMAP)</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Select models to visualize their document embedding spaces projected to 2D via UMAP.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {modelIds.map((id, i) => {
          const active = selectedModels.includes(id);
          const isLoading = loading[id];
          return (
            <button
              key={id}
              onClick={() => toggleModel(id)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
              {SHORT_NAME(id)}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>
      )}

      {selectedModels.length > 0 && (
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" name="UMAP-1" tick={{ fontSize: 10 }} />
            <YAxis dataKey="y" type="number" name="UMAP-2" tick={{ fontSize: 10 }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-lg">
                    <p className="font-semibold">{d.doc_id}</p>
                    <p>x: {d.x.toFixed(3)}, y: {d.y.toFixed(3)}</p>
                  </div>
                );
              }}
            />
            <Legend />
            {selectedModels.map((modelId, i) => {
              const colorIdx = modelIds.indexOf(modelId);
              const points = umapData[modelId] || [];
              return (
                <Scatter
                  key={modelId}
                  name={SHORT_NAME(modelId)}
                  data={points}
                  fill={MODEL_COLORS[colorIdx % MODEL_COLORS.length]}
                  opacity={0.7}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      )}

      {selectedModels.length === 0 && (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
          Select a model above to visualize its embedding space
        </div>
      )}
    </div>
  );
}
