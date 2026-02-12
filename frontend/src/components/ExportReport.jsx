import { useState } from 'react';
import { Download, FileJson, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

export default function ExportReport({ runId }) {
  const [exporting, setExporting] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = async (format) => {
    if (!runId) return;
    setExporting(format);
    setSuccess(null);

    try {
      const res = await api.post(`/results/${runId}/export`, null, {
        params: { format },
        responseType: format === 'markdown' ? 'text' : 'json',
      });

      const content = format === 'markdown' ? res.data : JSON.stringify(res.data, null, 2);
      const ext = format === 'markdown' ? 'md' : 'json';
      const mime = format === 'markdown' ? 'text/markdown' : 'application/json';

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `benchmark-report-${runId}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(format);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  if (!runId) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Export Report</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Download the benchmark results as a structured report.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => handleExport('json')}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50"
        >
          {exporting === 'json' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success === 'json' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <FileJson className="w-4 h-4 text-blue-500" />
          )}
          Export JSON
        </button>

        <button
          onClick={() => handleExport('markdown')}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50"
        >
          {exporting === 'markdown' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success === 'markdown' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <FileText className="w-4 h-4 text-purple-500" />
          )}
          Export Markdown
        </button>
      </div>
    </div>
  );
}
