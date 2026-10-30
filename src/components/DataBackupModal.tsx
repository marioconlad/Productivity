import React, { useRef, useState } from 'react';
import { Download, Upload, Database, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const {
    tasks,
    categories,
    habitLogs,
    progressMetrics,
    mentalCheckIns,
    theme,
    importAppData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let pomodoroSettings = null;
      try {
        const raw = localStorage.getItem('tempo_pomodoro_settings');
        if (raw) pomodoroSettings = JSON.parse(raw);
      } catch {
        // ignore
      }

      const backupData = {
        version: 1,
        appName: 'Tempo',
        exportedAt: now.toISOString(),
        data: {
          categories,
          tasks,
          habitLogs,
          progressMetrics,
          mentalCheckIns,
          pomodoroSettings,
          theme,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tempo-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Successfully exported data to tempo-backup-${dateStr}.json`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleImportClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('File is empty.');
        }

        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure.');
        }

        const dataContent = parsed.data || parsed;

        if (!Array.isArray(dataContent.categories) || !Array.isArray(dataContent.tasks)) {
          throw new Error('Missing required tasks or categories list in backup.');
        }

        const confirmed = window.confirm('This will replace all current data. Continue?');
        if (!confirmed) {
          return;
        }

        await importAppData(parsed);
        setSuccessMessage('All data restored successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setErrorMessage(
          `Import error: ${err.message || 'Invalid JSON file. Existing data was left untouched.'}`
        );
      }
    };

    reader.onerror = () => {
      setErrorMessage('Could not read the selected file. Existing data was left untouched.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 p-5 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Data Backup
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">Export or import your Tempo data as JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content info */}
        <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] space-y-2">
          <p>
            Backup includes all tasks, habits, reminders, goals, custom categories, CBT thought logs, and timer settings.
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-[#FF3B30] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleExport}
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl apple-subpanel hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center transition group-hover:scale-105">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
              Export data
            </span>
            <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] text-center">
              Download JSON backup
            </span>
          </button>

          <button
            onClick={handleImportClick}
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl apple-subpanel hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition group-hover:scale-105">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
              Import data
            </span>
            <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] text-center">
              Restore from JSON
            </span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium hover:bg-black/10 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
