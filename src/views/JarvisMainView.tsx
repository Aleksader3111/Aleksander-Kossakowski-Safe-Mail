import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  AlertOctagon,
  Clock,
  Calendar,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  Flame,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  CornerDownRight,
  Bot,
  User,
  RotateCw,
} from 'lucide-react';
import {
  EmailMessage,
  TaskItem,
  DeadlineItem,
  ReplyDraft,
  SyncStatus,
  OperatingMode,
} from '../types';
import { speechService, voiceSynthesizer } from '../services/voice';

interface JarvisMainViewProps {
  emails: EmailMessage[];
  tasks: TaskItem[];
  deadlines: DeadlineItem[];
  drafts: ReplyDraft[];
  syncStatus: SyncStatus;
  mode: OperatingMode;
  onSelectEmail: (email: EmailMessage) => void;
  onOpenDraftModal: (draft: ReplyDraft) => void;
  onSelectView: (view: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const JarvisMainView: React.FC<JarvisMainViewProps> = ({
  emails,
  tasks,
  deadlines,
  drafts,
  syncStatus,
  mode,
  onSelectEmail,
  onOpenDraftModal,
  onSelectView,
  onToggleTask,
}) => {
  const [greetingText, setGreetingText] = useState<string>('');
  const [isSpeakingGreeting, setIsSpeakingGreeting] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isAssistantThinking, setIsAssistantThinking] = useState<boolean>(false);
  const [recentConversations, setRecentConversations] = useState<
    { role: 'user' | 'assistant'; text: string; time: string }[]
  >([]);

  // Calculate real metrics
  const criticalEmails = emails.filter(e => e.priorityAssessment?.level === 'P0');
  const urgentEmails = emails.filter(e => e.priorityAssessment?.level === 'P1');
  const requiringReplyEmails = emails.filter(e => e.priorityAssessment?.requiresReply);
  const quarantinedCount = emails.filter(e => e.inQuarantine).length;
  const highRiskThreats = emails.filter(e => (e.securityReport?.overallRisk || 0) >= 60);

  // Generate dynamic greeting on mount or email changes
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const res = await fetch('/api/jarvis/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mailboxState: {
              totalCount: emails.length,
              criticalCount: criticalEmails.length,
              urgentCount: urgentEmails.length,
              threatsCount: highRiskThreats.length,
              requiringReplyCount: requiringReplyEmails.length,
              deadlinesCount: deadlines.length,
            },
          }),
        });
        const data = await res.json();
        setGreetingText(data.greeting);
      } catch {
        setGreetingText(
          `Dzień dobry. Jestem Jarvis. Przeanalizowałem Twoją skrzynkę. Masz ${emails.length} wiadomości, w tym ${criticalEmails.length + urgentEmails.length} spraw o wysokim priorytecie. Nie wykryłem nowych zagrożeń.`
        );
      }
    };

    fetchGreeting();
  }, [emails.length, criticalEmails.length, urgentEmails.length]);

  // Voice output playback
  const toggleGreetingVoice = () => {
    if (voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setIsSpeakingGreeting(false);
    } else {
      if (!greetingText) return;
      setIsSpeakingGreeting(true);
      voiceSynthesizer.speak(greetingText, {
        onEnd: () => setIsSpeakingGreeting(false),
        onError: () => setIsSpeakingGreeting(false),
      });
    }
  };

  // Voice input handling (STT)
  const toggleListening = () => {
    setVoiceError(null);
    if (isListening) {
      speechService.stop();
      setIsListening(false);
      return;
    }

    if (!speechService.isSupported()) {
      setVoiceError('Rozpoznawanie mowy nie jest wspierane w tej przeglądarce. Użyj pola tekstowego.');
      return;
    }

    setIsListening(true);
    setInterimVoiceText('');

    speechService.start({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setChatInput(text);
          setInterimVoiceText('');
          setIsListening(false);
          // Automatically trigger prompt on final speech
          handleSendPrompt(text);
        } else {
          setInterimVoiceText(text);
        }
      },
      onError: (err) => {
        setVoiceError(`Błąd mikrofonu: ${err}`);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const handleSendPrompt = async (forcedPrompt?: string) => {
    const promptToSend = (forcedPrompt || chatInput || interimVoiceText).trim();
    if (!promptToSend) return;

    // Clear input
    setChatInput('');
    setInterimVoiceText('');
    setVoiceError(null);

    const userMessageTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    setRecentConversations(prev => [
      ...prev,
      { role: 'user', text: promptToSend, time: userMessageTime },
    ]);

    setIsAssistantThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          mailboxContext: {
            totalCount: emails.length,
            criticalCount: criticalEmails.length,
            urgentCount: urgentEmails.length,
            quarantineCount: quarantinedCount,
            recentDeadlines: deadlines.slice(0, 5),
            openTasks: tasks.filter(t => t.status !== 'DONE').slice(0, 5),
          },
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'Zrozumiałem zapytanie. Brak dodatkowych szczegółów.';

      setRecentConversations(prev => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Read aloud Jarvis answer
      voiceSynthesizer.speak(replyText);
    } catch (err: any) {
      setRecentConversations(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Wystąpił błąd komunikacji: ${err.message}`,
          time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 1. JARVIS HERO GREETING CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-800 p-0.5 shadow-md shadow-cyan-950/60 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Osobisty Asystent Poczty
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] text-slate-400 font-mono">Tryb {mode}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Jarvis Mail Intelligence
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={toggleGreetingVoice}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isSpeakingGreeting
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-xs'
              }`}
              title="Odtwórz lub zatrzymaj głos Jarvisa"
            >
              {isSpeakingGreeting ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>Zatrzymaj głos</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Odsłuchaj briefing</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Speech bubble */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-sm">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {greetingText || 'Inicjalizacja modułu analizy skrzynki pocztowej...'}
          </p>
        </div>

        {/* Voice and Text Input Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-bounce'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold'
              }`}
              title={isListening ? 'Zatrzymaj nagrywanie' : 'Mów do Jarvisa po polsku'}
              aria-label="Mikrofon"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-slate-950" />}
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={chatInput || interimVoiceText}
                onChange={e => setChatInput(e.target.value)}
                placeholder={isListening ? 'Słucham Cię... powiedz polecenie...' : 'Wpisz polecenie dla Jarvisa (lub użyj mikrofonu)...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={isAssistantThinking || (!chatInput.trim() && !interimVoiceText.trim())}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white disabled:opacity-40 transition-colors shrink-0 border border-slate-700 cursor-pointer"
              aria-label="Wyślij"
            >
              {isAssistantThinking ? (
                <RotateCw className="w-5 h-5 animate-spin text-cyan-400" />
              ) : (
                <Send className="w-5 h-5 text-cyan-300" />
              )}
            </button>
          </form>

          {voiceError && (
            <p className="text-[11px] text-rose-400 mt-2 font-medium">{voiceError}</p>
          )}

          {/* Quick Prompts */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Polecenia:</span>
            {[
              'Czy mam coś pilnego?',
              'Pokaż pismo z sądu',
              'Przygotuj odpowiedź dla Marka',
              'Podsumuj dzisiejsze zadania',
              'Znajdź faktury',
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendPrompt(p)}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation stream if active */}
        {recentConversations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 max-h-52 overflow-y-auto custom-scrollbar">
            {recentConversations.slice(-4).map((c, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 text-xs p-3 rounded-xl ${
                  c.role === 'user' ? 'bg-slate-950/80 text-slate-200 border border-slate-800' : 'bg-cyan-950/40 text-cyan-200 border border-cyan-800/50'
                }`}
              >
                {c.role === 'user' ? (
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                ) : (
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold">{c.role === 'user' ? 'Ty' : 'Jarvis'}</span>
                    <span className="font-mono">{c.time}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SPRAWY KRYTYCZNE & PILNE (P0 & P1) */}
      {(criticalEmails.length > 0 || urgentEmails.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Wymagające Pilnej Uwagi ({criticalEmails.length + urgentEmails.length})
            </h3>
            <button
              onClick={() => onSelectView('priorytety')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Wszystkie priorytety</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {[...criticalEmails, ...urgentEmails].slice(0, 3).map(mail => {
              const p = mail.priorityAssessment;
              const isP0 = p?.level === 'P0';

              return (
                <div
                  key={mail.id}
                  onClick={() => onSelectEmail(mail)}
                  className={`bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer shadow-md hover:border-cyan-500/50 ${
                    isP0 ? 'border-rose-800/80 ring-1 ring-rose-500/30' : 'border-amber-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          isP0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {p?.level} – {isP0 ? 'KRYTYCZNE' : 'PILNE'}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[260px] sm:max-w-md">
                        {mail.subject}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 font-mono">
                      {new Date(mail.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1 mb-2 font-mono text-[11px]">
                    Od: {mail.from}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <CornerDownRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong className="text-white">Ocena Jarvisa:</strong> {p?.reason}
                      {p?.consequences && <span className="block text-rose-300 text-[11px] font-medium mt-0.5">Skutki zaniechania: {p.consequences}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. OCZEKUJĄCE AKCEPTACJE ODPOWIEDZI (CZĘŚĆ 10) */}
      {drafts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              Propozycje Odpowiedzi do Twojej Akceptacji ({drafts.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Wymagają zatwierdzenia</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between space-y-3 hover:border-cyan-500/40 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Styl: {draft.style}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(draft.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">
                    {draft.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Do: <span className="font-medium text-cyan-300 font-mono">{draft.toName || draft.toEmail}</span>
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-sans whitespace-pre-wrap line-clamp-3">
                    {draft.content}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">Jarvis przygotował szkic</span>
                  <button
                    onClick={() => onOpenDraftModal(draft)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-xs transition-colors cursor-pointer"
                  >
                    Przejrzyj & Wyślij
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. NAJBLIŻSZE TERMINY & OTWARTE ZADANIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Terminy */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Wykryte Terminy ({deadlines.length})
            </h3>
            <button
              onClick={() => onSelectView('kalendarz')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Kalendarz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {deadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Brak nadchodzących terminów.</p>
            ) : (
              deadlines.slice(0, 3).map(dl => (
                <div
                  key={dl.id}
                  className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                    dl.isLegalOrCourt ? 'bg-blue-950/40 border-blue-800/60' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-cyan-300">
                        {dl.date} {dl.time ? `o godz. ${dl.time}` : ''}
                      </span>
                      {dl.isLegalOrCourt && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-900 text-blue-200 border border-blue-700">
                          SĄDOWY
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-200">{dl.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                      "{dl.justificationFragment}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zadania */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Zadania z Korespondencji ({tasks.filter(t => t.status !== 'DONE').length})
            </h3>
            <button
              onClick={() => onSelectView('zadania')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Wszystkie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Brak otwartych zadań.</p>
            ) : (
              tasks.slice(0, 3).map(task => {
                const isDone = task.status === 'DONE';
                return (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-3 cursor-pointer hover:border-cyan-500/40 transition-all"
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-slate-200 truncate ${isDone ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      {task.deadline && (
                        <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                          Termin: {task.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. PODSUMOWANIE OCHRONY & GMAIL */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/70 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Ochrona Skrzynki Pocztowej</h4>
            <p className="text-xs text-slate-400">
              {quarantinedCount} wiadomości w kwarantannie • {highRiskThreats.length} wykrytych zagrożeń phishingowych
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectView('kwarantanna')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            Kwarantanna ({quarantinedCount})
          </button>
          <button
            onClick={() => onSelectView('zagrozenia')}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Centrum Zagrożeń
          </button>
        </div>
      </div>
    </div>
  );
};
