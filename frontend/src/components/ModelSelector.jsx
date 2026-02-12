import { useState, useEffect } from 'react';
import { Cpu, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { fetchModels } from '../api/client';

const PROVIDER_STYLES = {
  openai: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', label: 'OpenAI' },
  cohere: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'Cohere' },
  local: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Local' },
};

export default function ModelSelector({ selectedModels, onSelectionChange }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (modelId) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((m) => m !== modelId));
    } else if (selectedModels.length < 6) {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const grouped = models.reduce((acc, m) => {
    (acc[m.provider] = acc[m.provider] || []).push(m);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Embedding Models</h2>
        </div>
        <span className="text-sm text-gray-400">{selectedModels.length}/6 selected</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Choose 2–6 models to benchmark. Local models run on your machine; API models require keys.
      </p>

      {Object.entries(grouped).map(([provider, providerModels]) => {
        const style = PROVIDER_STYLES[provider] || PROVIDER_STYLES.local;
        return (
          <div key={provider} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {style.label}
              </span>
            </div>
            <div className="space-y-2">
              {providerModels.map((model) => {
                const isSelected = selectedModels.includes(model.id);
                const isDisabled = model.status === 'api_key_missing';
                return (
                  <button
                    key={model.id}
                    onClick={() => !isDisabled && toggle(model.id)}
                    disabled={isDisabled && !isSelected}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{model.model_name}</span>
                          <span className="text-xs text-gray-400">{model.dimension}d</span>
                          {isDisabled && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <KeyRound className="w-3 h-3" /> API key required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span>Max {model.max_tokens} tokens</span>
                          {model.cost_per_1k_tokens > 0 && (
                            <span>${model.cost_per_1k_tokens}/1K tokens</span>
                          )}
                          {model.cost_per_1k_tokens === 0 && <span className="text-green-600">Free (local)</span>}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
