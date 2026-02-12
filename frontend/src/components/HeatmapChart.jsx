import { useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';

const SHORT_NAME = (id) => id.split('/').pop();

function getColor(value, min, max) {
  if (max === min) return 'rgb(99, 102, 241)';
  const ratio = (value - min) / (max - min);
  const r = Math.round(255 - ratio * 156);
  const g = Math.round(255 - ratio * 153);
  const b = Math.round(255 - ratio * 14);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HeatmapChart({ results }) {
  const metrics = useMemo(() => [
    { key: 'mrr', label: 'MRR', get: (r) => r.ir_metrics.mrr },
    { key: 'map', label: 'MAP', get: (r) => r.ir_metrics.map_score },
    { key: 'p5', label: 'P@5', get: (r) => r.ir_metrics.precision_at_k?.[5] ?? 0 },
    { key: 'r5', label: 'R@5', get: (r) => r.ir_metrics.recall_at_k?.[5] ?? 0 },
    { key: 'r10', label: 'R@10', get: (r) => r.ir_metrics.recall_at_k?.[10] ?? 0 },
    { key: 'ndcg5', label: 'NDCG@5', get: (r) => r.ir_metrics.ndcg_at_k?.[5] ?? 0 },
    { key: 'ndcg10', label: 'NDCG@10', get: (r) => r.ir_metrics.ndcg_at_k?.[10] ?? 0 },
    { key: 'hr1', label: 'HR@1', get: (r) => r.ir_metrics.hit_rate_at_k?.[1] ?? 0 },
    { key: 'hr5', label: 'HR@5', get: (r) => r.ir_metrics.hit_rate_at_k?.[5] ?? 0 },
    { key: 'latency', label: 'Latency (ms)', get: (r) => r.performance.embedding_latency_avg_ms, invert: true },
  ], []);

  if (!results?.model_results?.length) return null;

  const mr = results.model_results;

  const grid = metrics.map((metric) => {
    const values = mr.map((r) => metric.get(r));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { metric, values, min, max };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Metrics Heatmap</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Models × metrics matrix. Darker = better (except latency where lighter = better).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 font-medium text-gray-500 sticky left-0 bg-white">Metric</th>
              {mr.map((r) => (
                <th key={r.model_id} className="text-center py-2 px-3 font-medium text-gray-700 min-w-[100px]">
                  {SHORT_NAME(r.model_id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map(({ metric, values, min, max }) => (
              <tr key={metric.key} className="border-t border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-600 sticky left-0 bg-white">{metric.label}</td>
                {values.map((val, i) => {
                  const effectiveMin = metric.invert ? max : min;
                  const effectiveMax = metric.invert ? min : max;
                  const bg = getColor(val, effectiveMin, effectiveMax);
                  const isBest = metric.invert ? val === min : val === max;
                  return (
                    <td key={mr[i].model_id} className="py-2 px-3 text-center">
                      <div
                        className={`inline-block px-3 py-1 rounded-md text-xs font-mono ${isBest ? 'ring-2 ring-indigo-400' : ''}`}
                        style={{ backgroundColor: bg, color: val > (min + max) / 2 && !metric.invert ? 'white' : '#1f2937' }}
                      >
                        {metric.key === 'latency' ? val.toFixed(1) : val.toFixed(4)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <span>Low</span>
        <div className="flex h-3 flex-1 rounded overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: getColor(i, 0, 19) }} />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
