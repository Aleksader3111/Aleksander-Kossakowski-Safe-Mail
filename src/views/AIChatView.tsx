import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Shield,
  HelpCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { EmailMessage } from '../types';

interface AIChatViewProps {
  emails: EmailMessage[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ emails }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Dzień dobry Aleksander! Jestem Twoim osobistym analitykiem bezpieczeństwa poczty AI Mail Guardian opartym na modelu Gemini. Monitoruję Twoją skrzynkę, weryfikuję nagłówki SPF/DKIM i chronię korespondencję przed wyłudzeniami. O co chciałbyś zapytać?',
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Czy mam ważną wiadomość z sądu?',
    'Czy ktoś próbował mnie oszukać?',
    'Pokaż ostatnie wiadomości z urzędów',
    'Dlaczego ten mail jest w kwarantannie?',
    'Podsumuj dzisiejszą pocztę',
    'Czy otrzymałem potwierdzenie zamówienia?',
    'Które wiadomości wymagają odpowiedzi?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    // Build context
    const mailboxContext = {
      totalCount: emails.length,
      importantCount: emails.filter(e => e.securityReport?.category === 'WAŻNE' || e.securityReport?.category === 'INSTYTUCJE').length,
      quarantineCount: emails.filter(e => e.inQuarantine).length,
      threatsCount: emails.filter(e => (e.securityReport?.overallRisk || 0) >= 60).length,
      recentThreats: emails.filter(e => e.inQuarantine).slice(0, 3).map(e => ({ subject: e.subject, from: e.from, reason: e.quarantineReason })),
      recentImportant: emails.filter(e => e.securityReport?.category === 'WAŻNE' || e.securityReport?.category === 'INSTYTUCJE').slice(0, 3).map(e => ({ subject: e.subject, from: e.from })),
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mailboxContext,
          history: messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Błąd serwera (${res.status})`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Przepraszam, nie udało się uzyskać odpowiedzi.',
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant',
          text: `Wystąpił problem z połączeniem z silnikiem AI: ${err.message}. Silnik heurystyczny nadal chroni Twoją skrzynkę.`,
          timestamp: new Date().toLocaleTimeString('pl-PL'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Asystent Cyberbezpieczeństwa Gemini
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                GOTOWY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Analizuje kontekst {emails.length} wiadomości w skrzynce akossakowski18@gmail.com
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Odporność na Prompt Injection</span>
        </div>
      </div>

      {/* Suggested prompts bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto whitespace-nowrap flex items-center gap-2 custom-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Szybkie pytania:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors shrink-0 border border-slate-700/60"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none whitespace-pre-line'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>{msg.sender === 'user' ? 'Ty' : 'AI Mail Guardian'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2 border border-slate-700/80">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Analizuję treść skrzynki i generuję odpowiedź...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            placeholder="Zadaj pytanie asystentowi (np. Czy mam pismo z sądu w tym tygodniu?)..."
            className="flex-1 bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </form>
      </div>
    </div>
  );
};
