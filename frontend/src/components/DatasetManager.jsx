import { useState, useEffect } from 'react';
import { Database, FileText, ChevronRight } from 'lucide-react';
import { fetchDatasets } from '../api/client';

const CATEGORY_COLORS = {
  general: 'bg-blue-100 text-blue-700',
  technical: 'bg-purple-100 text-purple-700',
  legal: 'bg-amber-100 text-amber-700',
};

export default function DatasetManager({ selectedDataset, onSelect }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets()
      .then(setDatasets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Evaluation Datasets</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Select a benchmark dataset with ground-truth query-document relevance pairs.
      </p>
      <div className="space-y-3">
        {datasets.map((ds) => {
          const isSelected = selectedDataset?.id === ds.id;
          return (
            <button
              key={ds.id}
              onClick={() => onSelect(ds)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{ds.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ds.category] || 'bg-gray-100 text-gray-600'}`}>
                      {ds.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{ds.description}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{ds.document_count} documents</span>
                    <span>{ds.query_count} queries</span>
                    <span>~{Math.round(ds.avg_doc_length)} chars avg</span>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 mt-1 transition-colors ${isSelected ? 'text-indigo-500' : 'text-gray-300'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
