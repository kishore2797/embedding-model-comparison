import { useState } from 'react';
import { Search, Loader2, Zap } from 'lucide-react';
import { liveQuery } from '../api/client';

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const SHORT_NAME = (id) => id.split('/').pop();

export default function QueryExplorer({ runId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || !runId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await liveQuery({ run_id: runId, query: query.trim(), top_k: 5 });
      setResults(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  if (!runId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <Search className="w-8 h-8 mx-auto mb-2" />
        <p>Complete a benchmark to explore queries</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Live Query Explorer</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Type a query to see how each model retrieves documents in real time.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter a search query..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>
      )}

      {results && results.results?.length > 0 && (
        <div className="space-y-6">
          {results.results.map((modelResult, mi) => (
            <div key={modelResult.model_id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[mi % MODEL_COLORS.length] }} />
                  <span className="font-medium text-sm text-gray-900">{SHORT_NAME(modelResult.model_id)}</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Zap className="w-3 h-3" /> {modelResult.latency_ms.toFixed(0)}ms
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {modelResult.hits.map((hit) => (
                  <div key={hit.doc_id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-gray-400">{hit.doc_id}</span>
                      <span className="text-xs font-medium text-indigo-600">
                        Score: {hit.score.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{hit.text}</p>
                  </div>
                ))}
                {modelResult.hits.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">No results</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
