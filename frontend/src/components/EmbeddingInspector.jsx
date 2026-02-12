import { useState } from 'react';
import { Microscope, Loader2 } from 'lucide-react';
import { computeSimilarity } from '../api/client';

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const SHORT_NAME = (id) => id.split('/').pop();

export default function EmbeddingInspector({ runId, modelIds }) {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!textA.trim() || !textB.trim() || !runId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await computeSimilarity({
        run_id: runId,
        text_a: textA.trim(),
        text_b: textB.trim(),
      });
      setScores(res.scores);
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  if (!runId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <Microscope className="w-8 h-8 mx-auto mb-2" />
        <p>Complete a benchmark to inspect embeddings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Microscope className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Embedding Inspector</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Compare cosine similarity between two texts across all benchmarked models.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Text A</label>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Enter first text..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Text B</label>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Enter second text..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={loading || !textA.trim() || !textB.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
        Compare Similarity
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>
      )}

      {scores && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Cosine Similarity Scores</h3>
          {Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .map(([modelId, score], i) => {
              const colorIdx = modelIds?.indexOf(modelId) ?? i;
              const pct = Math.max(0, Math.min(100, score * 100));
              return (
                <div key={modelId} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MODEL_COLORS[colorIdx % MODEL_COLORS.length] }} />
                  <span className="text-sm font-medium text-gray-700 w-36 shrink-0">{SHORT_NAME(modelId)}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: MODEL_COLORS[colorIdx % MODEL_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-900 w-16 text-right">{score.toFixed(4)}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
