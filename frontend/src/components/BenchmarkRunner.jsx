import { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { startBenchmark, getBenchmarkStatus, cancelBenchmark, fetchModels } from '../api/client';

export default function BenchmarkRunner({ dataset, selectedModels, onComplete }) {
  const [allModels, setAllModels] = useState([]);

  useEffect(() => {
    fetchModels().then(setAllModels).catch(() => {});
  }, []);
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const canRun = dataset && selectedModels.length >= 1;

  const handleStart = async () => {
    if (!canRun) return;
    setError(null);
    setRunning(true);

    try {
      const res = await startBenchmark({
        dataset_id: dataset.id,
        model_ids: selectedModels,
        top_k_values: [1, 3, 5, 10, 20],
        similarity_metric: 'cosine',
        normalize_embeddings: true,
      });

      setStatus({ ...res, status: 'running', models_completed: 0, total_models: selectedModels.length });

      pollRef.current = setInterval(async () => {
        try {
          const progress = await getBenchmarkStatus(res.run_id);
          setStatus(progress);
          if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
            clearInterval(pollRef.current);
            setRunning(false);
            if (progress.status === 'completed') {
              onComplete(progress.run_id);
            }
            if (progress.status === 'failed') {
              setError('Benchmark failed');
            }
          }
        } catch {
          clearInterval(pollRef.current);
          setRunning(false);
          setError('Lost connection to server');
        }
      }, 1000);
    } catch (err) {
      setRunning(false);
      setError(err.response?.data?.detail || 'Failed to start benchmark');
    }
  };

  const handleCancel = async () => {
    if (status?.run_id) {
      try {
        await cancelBenchmark(status.run_id);
      } catch {}
    }
    if (pollRef.current) clearInterval(pollRef.current);
    setRunning(false);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const progress = status && status.total_models > 0
    ? Math.round((status.models_completed / status.total_models) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Run Benchmark</h2>
        {status?.status === 'completed' && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        )}
      </div>

      {!running && !status?.run_id && (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            {!dataset && <p className="text-amber-600">Select a dataset first</p>}
            {dataset && selectedModels.length < 1 && <p className="text-amber-600">Select at least 1 model</p>}
            {canRun && (
              <>
                <p>
                  Ready to benchmark <strong>{selectedModels.length}</strong> model{selectedModels.length > 1 ? 's' : ''} on{' '}
                  <strong>{dataset.name}</strong> ({dataset.document_count} docs, {dataset.query_count} queries)
                </p>
                {(() => {
                  const paidModels = selectedModels.filter((id) => {
                    const m = allModels.find((am) => am.id === id);
                    return m && m.cost_per_1k_tokens > 0;
                  });
                  if (paidModels.length === 0) return null;
                  const estTokens = (dataset.avg_doc_length / 4) * dataset.document_count;
                  const totalCost = paidModels.reduce((sum, id) => {
                    const m = allModels.find((am) => am.id === id);
                    return sum + (estTokens / 1000) * (m?.cost_per_1k_tokens || 0);
                  }, 0);
                  return (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>{paidModels.length} paid model{paidModels.length > 1 ? 's' : ''}</strong> selected.
                        Estimated API cost: <strong>${totalCost.toFixed(4)}</strong> ({Math.round(estTokens).toLocaleString()} tokens × {paidModels.length} model{paidModels.length > 1 ? 's' : ''})
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={!canRun}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              canRun
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" /> Start Benchmark
          </button>
        </div>
      )}

      {running && status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {status.current_model ? `Embedding: ${status.current_model}` : 'Starting...'}
            </span>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
            >
              <Square className="w-3 h-3" /> Cancel
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
            <div>
              <div className="font-semibold text-gray-900 text-lg">{status.models_completed}/{status.total_models}</div>
              Models
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-lg">{status.documents_embedded}/{status.total_documents}</div>
              Docs embedded
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-lg">
                {status.eta_seconds != null ? `${Math.round(status.eta_seconds)}s` : '—'}
              </div>
              ETA
            </div>
          </div>
        </div>
      )}

      {!running && status?.status === 'completed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(status.elapsed_seconds)}s total</span>
            <span>{status.total_models} models benchmarked</span>
          </div>
          <button
            onClick={handleStart}
            disabled={!canRun}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <Play className="w-4 h-4" /> Re-run Benchmark
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <XCircle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
}
