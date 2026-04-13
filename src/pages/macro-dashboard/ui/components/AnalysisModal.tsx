import { AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';

type AnalysisModalProps = {
  title: string;
  analysis: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

const AnalysisModal = ({ title, analysis, isLoading, error, onClose }: AnalysisModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#6366f1]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--neutral-100)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-[200px] px-6 py-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="size-8 animate-spin text-[#6366f1]" />
              <p className="text-sm text-[var(--text-tertiary)]">Upstage Solar가 분석 중입니다...</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {analysis && !isLoading && (
            <div className="prose prose-sm max-w-none">
              {analysis.split('\n').map((line, index) => {
                if (line.startsWith('##')) {
                  return (
                    <p key={index} className="mb-1 mt-3 text-sm font-bold text-[var(--text-primary)]">
                      {line.replace(/^##\s*/, '')}
                    </p>
                  );
                }

                if (/^\d+\./.test(line) || line.startsWith('- ') || line.startsWith('• ')) {
                  return (
                    <p key={index} className="ml-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {line}
                    </p>
                  );
                }

                if (line.trim() === '') {
                  return <div key={index} className="h-2" />;
                }

                return (
                  <p key={index} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {line}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--neutral-200)] px-6 py-3">
          <p className="mr-auto text-xs text-[var(--text-tertiary)]">Powered by Upstage Solar</p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[var(--neutral-100)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
