import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShieldCheck,
  AlertOctagon,
  Clock,
} from 'lucide-react';
import { runAllTestCases } from '../security/testCases';
import { TestResult } from '../types';

export const TestRunnerView: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>(() => runAllTestCases());
  const [isRunning, setIsRunning] = useState(false);

  const passedCount = testResults.filter(t => t.status === 'PASS').length;
  const failedCount = testResults.filter(t => t.status === 'FAIL').length;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllTestCases();
      setTestResults(results);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                SUITA TESTÓW AUTOMATYCZNYCH (CZĘŚĆ 19)
              </span>
              <span className="text-xs font-mono text-slate-300">
                Stan: {passedCount}/20 ZDANYCH
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              20 Obowiązkowych Testów Bezpieczeństwa
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Rygorystyczna weryfikacja logiki analizatora: od urzędów i banków, przez Temu, faktury PDF, Prompt Injection, po awarie API i blokady operacji niszczących.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isRunning ? 'Wykonywanie testów...' : 'Uruchom ponownie suitę'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Wykonane testy</p>
            <h3 className="text-2xl font-bold text-white mt-1">20</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
            20/20
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400">Zdane (PASS)</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{passedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-400">Błędy (FAIL)</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{failedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
            {failedCount === 0 ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Tests Table / List */}
      <div className="space-y-3">
        {testResults.map(t => (
          <div
            key={t.id}
            className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
              t.status === 'PASS'
                ? 'border-slate-800 hover:border-slate-700'
                : 'border-red-800/80 bg-red-950/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {t.status}
                </span>
                <h4 className="text-xs font-bold text-white">{t.title}</h4>
              </div>

              {t.executedAt && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(t.executedAt).toLocaleTimeString('pl-PL')}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2">{t.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/40 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-0.5">Dane wejściowe:</span>
                <span className="text-slate-300 font-mono text-[10px]">{t.inputSummary}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-cyan-400 block font-semibold mb-0.5">Oczekiwany wynik:</span>
                <span className="text-slate-200">{t.expectedCategoryOrOutcome}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-emerald-400 block font-semibold mb-0.5">Rzeczywisty wynik:</span>
                <span className="text-emerald-300 font-mono text-[10px]">{t.actualResult}</span>
              </div>
            </div>

            {t.errorDetails && (
              <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono">
                Błąd: {t.errorDetails}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
