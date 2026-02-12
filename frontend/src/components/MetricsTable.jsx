import { useState } from 'react';
import { ArrowUpDown, Trophy, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const SHORT_NAME = (id) => id.split('/').pop();

function IRMetricsTable({ results }) {
  const [sortKey, setSortKey] = useState('mrr');
  const [sortDir, setSortDir] = useState('desc');

  const getValue = (r, key) => {
    if (key === 'mrr') return r.ir_metrics.mrr;
    if (key === 'map') return r.ir_metrics.map_score;
    if (key.startsWith('p@')) return r.ir_metrics.precision_at_k?.[parseInt(key.slice(2))] ?? 0;
    if (key.startsWith('r@')) return r.ir_metrics.recall_at_k?.[parseInt(key.slice(2))] ?? 0;
    if (key.startsWith('ndcg@')) return r.ir_metrics.ndcg_at_k?.[parseInt(key.slice(5))] ?? 0;
    if (key.startsWith('hr@')) return r.ir_metrics.hit_rate_at_k?.[parseInt(key.slice(3))] ?? 0;
    return 0;
  };

  const sorted = [...results].sort((a, b) => {
    const va = getValue(a, sortKey);
    const vb = getValue(b, sortKey);
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const columns = [
    { key: 'mrr', label: 'MRR' },
    { key: 'map', label: 'MAP' },
    { key: 'p@5', label: 'P@5' },
    { key: 'r@5', label: 'R@5' },
    { key: 'ndcg@5', label: 'NDCG@5' },
    { key: 'ndcg@10', label: 'NDCG@10' },
    { key: 'hr@1', label: 'HR@1' },
    { key: 'hr@5', label: 'HR@5' },
  ];

  const bestValues = {};
  columns.forEach(col => {
    bestValues[col.key] = Math.max(...results.map(r => getValue(r, col.key)));
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-500">Model</th>
            {columns.map(col => (
              <th
                key={col.key}
                className="text-right py-2 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort(col.key)}
              >
                <span className="flex items-center justify-end gap-1">
                  {col.label}
                  {sortKey === col.key && <ArrowUpDown className="w-3 h-3" />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.model_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                {SHORT_NAME(r.model_id)}
                {i === 0 && sortDir === 'desc' && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
              </td>
              {columns.map(col => {
                const val = getValue(r, col.key);
                const isBest = val === bestValues[col.key] && val > 0;
                return (
                  <td key={col.key} className={`text-right py-2 px-3 tabular-nums ${isBest ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`}>
                    {val.toFixed(4)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PerformanceTable({ results }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-500">Model</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Embed Avg (ms)</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Embed P95 (ms)</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Query Avg (ms)</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Throughput</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Dimension</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Memory (MB)</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Cost ($)</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.model_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                {SHORT_NAME(r.model_id)}
              </td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.embedding_latency_avg_ms.toFixed(1)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.embedding_latency_p95_ms.toFixed(1)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.query_latency_avg_ms.toFixed(1)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.throughput_docs_per_sec.toFixed(1)}/s</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.embedding_dimension}</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">{r.performance.memory_usage_mb.toFixed(2)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-gray-700">${r.performance.api_cost_usd.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RadarChartView({ results }) {
  const metrics = ['MRR', 'MAP', 'P@5', 'R@5', 'NDCG@10', 'HR@5'];
  const getVal = (r, m) => {
    switch (m) {
      case 'MRR': return r.ir_metrics.mrr;
      case 'MAP': return r.ir_metrics.map_score;
      case 'P@5': return r.ir_metrics.precision_at_k?.[5] ?? 0;
      case 'R@5': return r.ir_metrics.recall_at_k?.[5] ?? 0;
      case 'NDCG@10': return r.ir_metrics.ndcg_at_k?.[10] ?? 0;
      case 'HR@5': return r.ir_metrics.hit_rate_at_k?.[5] ?? 0;
      default: return 0;
    }
  };

  const data = metrics.map(m => {
    const point = { metric: m };
    results.forEach(r => { point[r.model_id] = getVal(r, m); });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
        {results.map((r, i) => (
          <Radar
            key={r.model_id}
            name={SHORT_NAME(r.model_id)}
            dataKey={r.model_id}
            stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
            fill={MODEL_COLORS[i % MODEL_COLORS.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function AccuracyVsLatencyChart({ results }) {
  const data = results.map((r, i) => ({
    name: SHORT_NAME(r.model_id),
    mrr: r.ir_metrics.mrr,
    latency: r.performance.embedding_latency_avg_ms,
    dimension: r.performance.embedding_dimension,
    fill: MODEL_COLORS[i % MODEL_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="latency" name="Latency (ms)" type="number" tick={{ fontSize: 12 }} label={{ value: 'Avg Embed Latency (ms)', position: 'bottom', fontSize: 12 }} />
        <YAxis dataKey="mrr" name="MRR" domain={[0, 1]} tick={{ fontSize: 12 }} label={{ value: 'MRR', angle: -90, position: 'insideLeft', fontSize: 12 }} />
        <ZAxis dataKey="dimension" range={[60, 300]} name="Dimension" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
          if (!payload?.length) return null;
          const d = payload[0].payload;
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-lg">
              <p className="font-semibold">{d.name}</p>
              <p>MRR: {d.mrr.toFixed(4)}</p>
              <p>Latency: {d.latency.toFixed(1)}ms</p>
              <p>Dimension: {d.dimension}</p>
            </div>
          );
        }} />
        <Scatter data={data} shape="circle">
          {data.map((entry, i) => (
            <circle key={i} r={8} fill={entry.fill} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function BarChartView({ results }) {
  const kValues = [1, 3, 5, 10, 20];
  const data = kValues.map(k => {
    const point = { k: `@${k}` };
    results.forEach(r => {
      point[r.model_id] = r.ir_metrics.recall_at_k?.[k] ?? 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="k" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
        {results.map((r, i) => (
          <Bar key={r.model_id} dataKey={r.model_id} name={SHORT_NAME(r.model_id)} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
        ))}
        <Tooltip />
        <Legend />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function MetricsDashboard({ results }) {
  const [tab, setTab] = useState('accuracy');

  if (!results || !results.model_results?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2" />
        <p>Run a benchmark to see results</p>
      </div>
    );
  }

  const mr = results.model_results;
  const tabs = [
    { id: 'accuracy', label: 'Retrieval Accuracy' },
    { id: 'performance', label: 'Performance & Cost' },
    { id: 'radar', label: 'Radar Chart' },
    { id: 'recall', label: 'Recall@K' },
    { id: 'scatter', label: 'Accuracy vs Latency' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Benchmark Results</h2>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accuracy' && <IRMetricsTable results={mr} />}
      {tab === 'performance' && <PerformanceTable results={mr} />}
      {tab === 'radar' && <RadarChartView results={mr} />}
      {tab === 'recall' && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recall@K across models</h3>
          <BarChartView results={mr} />
        </div>
      )}
      {tab === 'scatter' && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">MRR vs Embedding Latency (bubble size = dimension)</h3>
          <AccuracyVsLatencyChart results={mr} />
        </div>
      )}
    </div>
  );
}
