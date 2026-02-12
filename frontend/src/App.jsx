import { useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import './App.css';

import DatasetManager from './components/DatasetManager';
import ModelSelector from './components/ModelSelector';
import BenchmarkRunner from './components/BenchmarkRunner';
import MetricsDashboard from './components/MetricsTable';
import QueryExplorer from './components/QueryExplorer';
import PerQueryAnalysis from './components/PerQueryAnalysis';
import HeatmapChart from './components/HeatmapChart';
import RankingTable from './components/RankingTable';
import EmbeddingViz from './components/EmbeddingViz';
import EmbeddingInspector from './components/EmbeddingInspector';
import ExportReport from './components/ExportReport';
import { getResults } from './api/client';

function App() {
  const [dataset, setDataset] = useState(null);
  const [selectedModels, setSelectedModels] = useState([]);
  const [results, setResults] = useState(null);
  const [runId, setRunId] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');

  const handleBenchmarkComplete = async (id) => {
    setRunId(id);
    try {
      const res = await getResults(id);
      setResults(res);
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  };

  const modelIds = results?.model_results?.map((r) => r.model_id) || [];

  const tabs = [
    { id: 'setup', label: 'Setup & Run' },
    { id: 'results', label: 'Results', disabled: !results },
    { id: 'visualize', label: 'Visualize', disabled: !results },
    { id: 'queries', label: 'Per-Query', disabled: !results },
    { id: 'explore', label: 'Explore', disabled: !runId },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <GitCompareArrows className="w-7 h-7 text-indigo-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Embedding Model Comparison</h1>
                <p className="text-xs text-gray-500">Benchmark retrieval accuracy across embedding models</p>
              </div>
            </div>
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => !t.disabled && setActiveTab(t.id)}
                  disabled={t.disabled}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === t.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : t.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <DatasetManager selectedDataset={dataset} onSelect={setDataset} />
              <BenchmarkRunner
                dataset={dataset}
                selectedModels={selectedModels}
                onComplete={handleBenchmarkComplete}
              />
            </div>
            <div>
              <ModelSelector
                selectedModels={selectedModels}
                onSelectionChange={setSelectedModels}
              />
            </div>
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="space-y-6">
            <MetricsDashboard results={results} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RankingTable results={results} />
              <ExportReport runId={runId} />
            </div>
          </div>
        )}

        {activeTab === 'visualize' && results && (
          <div className="space-y-6">
            <HeatmapChart results={results} />
            <EmbeddingViz runId={runId} modelIds={modelIds} />
            <EmbeddingInspector runId={runId} modelIds={modelIds} />
          </div>
        )}

        {activeTab === 'queries' && results && (
          <PerQueryAnalysis results={results} />
        )}

        {activeTab === 'explore' && (
          <QueryExplorer runId={runId} />
        )}
      </main>
    </div>
  );
}

export default App;
