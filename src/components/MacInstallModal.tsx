import React, { useState } from 'react';
import {
  Laptop,
  X,
  Check,
  Copy,
  Download,
  Sparkles,
  ExternalLink,
  Apple,
  Terminal,
} from 'lucide-react';

interface MacInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacInstallModal: React.FC<MacInstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'dmg'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const dmgScript = `# 1. In your Mac Terminal, inside the app folder:
npm install

# 2. Package into a macOS .dmg (uses the official Tempo icon):
npm run package:mac`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dmgScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="apple-panel border border-white/60 dark:border-white/10 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative space-y-4 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/10 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center justify-center">
            <Apple className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
              Run on Mac (1-Week Test)
            </h2>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
              Choose the fastest way to run Tempo as a desktop app on macOS
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-white/20 text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Add to Mac Dock (Instant)</span>
          </button>
          <button
            onClick={() => setActiveTab('dmg')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'dmg'
                ? 'bg-white dark:bg-white/20 text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-500" />
            <span>Build .DMG (Electron)</span>
          </button>
        </div>

        {/* Tab 1: PWA Add to Dock */}
        {activeTab === 'pwa' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl apple-subpanel text-xs space-y-1.5">
              <span className="font-semibold text-[#0A84FF] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Recommended: Zero installation delay</span>
              </span>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                macOS natively turns this app into an isolated desktop app in your Mac Dock with full keyboard shortcuts, standalone window, and offline support.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl apple-subpanel">
                <div className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-0.5">
                  In Safari (macOS Sonoma & Sequoia):
                </div>
                <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                  Click the Mac menu bar: <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">File</strong> &gt; <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">Add to Dock...</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl apple-subpanel">
                <div className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-0.5">
                  In Google Chrome / Brave / Edge:
                </div>
                <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                  Click the <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">Install icon</strong> in the URL bar (or menu <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">Save and Share &gt; Install Tempo</strong>).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DMG Build */}
        {activeTab === 'dmg' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl apple-subpanel text-xs space-y-1.5">
              <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>macOS DMG Packager</span>
              </span>
              <p className="text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                Apple Disk Images (<code className="font-mono">.dmg</code>) require macOS-native disk utility tools (<code className="font-mono">hdiutil</code>) to create. Run these 3 commands in your Mac terminal:
              </p>
            </div>

            <div className="relative">
              <pre className="p-3 rounded-xl bg-black/80 text-white font-mono text-[11px] overflow-x-auto leading-relaxed border border-white/10">
                {dmgScript}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom dismiss */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#0071E3] transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
