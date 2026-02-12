import { useState } from 'react';
import { ListFilter, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

const MODEL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

const SHORT_NAME = (id) => id.split('/').pop();

export default function PerQueryAnalysis({ results }) {
  const [filter, setFilter] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState(null);

  if (!results?.model_results?.length) {
    return null;
  }

  const mr = results.model_results;
  const queries = mr[0]?.per_query_results || [];

  const queryAnalysis = queries.map((q, qi) => {
    const modelHits = mr.map((r) => {
      const pqr = r.per_query_results?.[qi];
      if (!pqr) return { model_id: r.model_id, found: false, retrieved: [] };
      const retrievedIds = pqr.retrieved.map(h => h.doc_id);
      const found = pqr.relevant.some(rid => retrievedIds.slice(0, 5).includes(rid));
      return { model_id: r.model_id, found, retrieved: pqr.retrieved, relevant: pqr.relevant };
    });
    const allCorrect = modelHits.every(m => m.found);
    const allWrong = modelHits.every(m => !m.found);
    const disagree = !allCorrect && !allWrong;
    return { query: q.query, relevant: q.relevant, modelHits, allCorrect, allWrong, disagree, index: qi };
  });

  const filtered = queryAnalysis.filter(q => {
    if (filter === 'correct') return q.allCorrect;
    if (filter === 'wrong') return q.allWrong;
    if (filter === 'disagree') return q.disagree;
    return true;
  });

  const filters = [
    { id: 'all', label: 'All', count: queryAnalysis.length },
    { id: 'correct', label: 'All Correct', count: queryAnalysis.filter(q => q.allCorrect).length },
    { id: 'wrong', label: 'All Wrong', count: queryAnalysis.filter(q => q.allWrong).length },
    { id: 'disagree', label: 'Disagree', count: queryAnalysis.filter(q => q.disagree).length },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListFilter className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Per-Query Analysis</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setSelectedQuery(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map((q) => (
          <button
            key={q.index}
            onClick={() => setSelectedQuery(selectedQuery === q.index ? null : q.index)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedQuery === q.index ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-800 flex-1">{q.query}</p>
              <div className="flex items-center gap-1 shrink-0">
                {q.modelHits.map((m, mi) => (
                  <div
                    key={m.model_id}
                    title={`${SHORT_NAME(m.model_id)}: ${m.found ? 'hit' : 'miss'}`}
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      m.found ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {m.found
                      ? <CheckCircle2 className="w-3 h-3 text-green-600" />
                      : <XCircle className="w-3 h-3 text-red-400" />
                    }
                  </div>
                ))}
              </div>
            </div>

            {selectedQuery === q.index && (
              <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                <div className="text-xs text-gray-500">
                  Relevant: {q.relevant.join(', ')}
                </div>
                {q.modelHits.map((m, mi) => (
                  <div key={m.model_id} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[mi % MODEL_COLORS.length] }} />
                      <span className="font-medium">{SHORT_NAME(m.model_id)}</span>
                      {m.found ? (
                        <span className="text-green-600">Hit</span>
                      ) : (
                        <span className="text-red-500">Miss</span>
                      )}
                    </div>
                    <div className="ml-5 space-y-0.5">
                      {(m.retrieved || []).slice(0, 5).map((h, hi) => {
                        const isRelevant = (m.relevant || []).includes(h.doc_id);
                        return (
                          <div key={hi} className={`flex justify-between ${isRelevant ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            <span>#{hi + 1} {h.doc_id}</span>
                            <span>{h.score.toFixed(4)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
