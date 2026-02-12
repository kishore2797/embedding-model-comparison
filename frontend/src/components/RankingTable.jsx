import { useState, useMemo } from 'react';
import { Award, SlidersHorizontal } from 'lucide-react';

const SHORT_NAME = (id) => id.split('/').pop();

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const DEFAULT_WEIGHTS = {
  mrr: 25,
  map: 20,
  ndcg10: 20,
  recall5: 15,
  latency: 10,
  cost: 10,
};

export default function RankingTable({ results }) {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);

  const rankings = useMemo(() => {
    if (!results?.model_results?.length) return [];

    const mr = results.model_results;

    const rawScores = mr.map((r) => ({
      model_id: r.model_id,
      mrr: r.ir_metrics.mrr,
      map: r.ir_metrics.map_score,
      ndcg10: r.ir_metrics.ndcg_at_k?.[10] ?? 0,
      recall5: r.ir_metrics.recall_at_k?.[5] ?? 0,
      latency: r.performance.embedding_latency_avg_ms,
      cost: r.performance.api_cost_usd,
    }));

    // Normalize each metric to [0, 1]
    const keys = ['mrr', 'map', 'ndcg10', 'recall5', 'latency', 'cost'];
    const mins = {};
    const maxs = {};
    keys.forEach((k) => {
      const vals = rawScores.map((s) => s[k]);
      mins[k] = Math.min(...vals);
      maxs[k] = Math.max(...vals);
    });

    const normalize = (val, key) => {
      if (maxs[key] === mins[key]) return 1;
      const norm = (val - mins[key]) / (maxs[key] - mins[key]);
      // For latency and cost, lower is better
      if (key === 'latency' || key === 'cost') return 1 - norm;
      return norm;
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

    return rawScores
      .map((s) => {
        let score = 0;
        keys.forEach((k) => {
          score += normalize(s[k], k) * (weights[k] / totalWeight);
        });
        return { ...s, score: Math.round(score * 100) };
      })
      .sort((a, b) => b.score - a.score);
  }, [results, weights]);

  if (!results?.model_results?.length) return null;

  const weightLabels = {
    mrr: 'MRR',
    map: 'MAP',
    ndcg10: 'NDCG@10',
    recall5: 'Recall@5',
    latency: 'Latency',
    cost: 'Cost',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Overall Ranking</h2>
        </div>
        <button
          onClick={() => setShowWeights(!showWeights)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <SlidersHorizontal className="w-4 h-4" /> Weights
        </button>
      </div>

      {showWeights && (
        <div className="grid grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          {Object.entries(weightLabels).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600 flex justify-between">
                {label} <span className="text-gray-400">{weights[key]}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weights[key]}
                onChange={(e) => setWeights((w) => ({ ...w, [key]: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {rankings.map((r, i) => {
          const colorIdx = results.model_results.findIndex((m) => m.model_id === r.model_id);
          return (
            <div key={r.model_id} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-amber-100 text-amber-700' :
                i === 1 ? 'bg-gray-100 text-gray-600' :
                i === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                #{i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[colorIdx % MODEL_COLORS.length] }} />
                  <span className="font-medium text-sm text-gray-900">{SHORT_NAME(r.model_id)}</span>
                  <span className="text-xs text-gray-400">MRR={r.mrr.toFixed(3)} MAP={r.map.toFixed(3)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${r.score}%`,
                      backgroundColor: MODEL_COLORS[colorIdx % MODEL_COLORS.length],
                    }}
                  />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 w-12 text-right">{r.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
