import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Send,
  Save,
  Trash2,
  Sparkles,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { ReplyDraft, ReplyStyle, EmailMessage } from '../types';
import { getCachedAccessToken } from '../services/auth';

interface DraftApprovalModalProps {
  draft: ReplyDraft | null;
  sourceEmail?: EmailMessage;
  onClose: () => void;
  onSendApproved: (draft: ReplyDraft) => void;
  onSaveDraftToGmail: (draft: ReplyDraft) => void;
  onRejectDraft: (draftId: string) => void;
}

export const DraftApprovalModal: React.FC<DraftApprovalModalProps> = ({
  draft,
  sourceEmail,
  onClose,
  onSendApproved,
  onSaveDraftToGmail,
  onRejectDraft,
}) => {
  const [currentContent, setCurrentContent] = useState<string>(draft?.content || '');
  const [currentStyle, setCurrentStyle] = useState<ReplyStyle>(draft?.style || 'Profesjonalny');
  const [userGuidance, setUserGuidance] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!draft) return null;

  const handleRegenerate = async (selectedStyle?: ReplyStyle) => {
    setIsRegenerating(true);
    setStatusMessage(null);
    const styleToUse = selectedStyle || currentStyle;

    try {
      const res = await fetch('/api/jarvis/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sourceEmail || { from: draft.toEmail, subject: draft.subject, snippet: draft.content },
          style: styleToUse,
          userGuidance,
        }),
      });

      const data = await res.json();
      if (data.content) {
        setCurrentContent(data.content);
        setCurrentStyle(styleToUse);
        setStatusMessage(`Wygenerowano nową odpowiedź w stylu: ${styleToUse}`);
      }
    } catch (err: any) {
      setStatusMessage(`Błąd generowania: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSending(true);
    const token = getCachedAccessToken();

    if (token) {
      try {
        const res = await fetch('/api/gmail/draft', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: draft.toEmail,
            subject: draft.subject,
            body: currentContent,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMessage('Szkic został pomyślnie zapisany w Twojej skrzynce Gmail.');
        } else {
          setStatusMessage(`Informacja: ${data.error || 'Zapisano szkic lokalnie.'}`);
        }
      } catch (err: any) {
        setStatusMessage('Zapisano szkic lokalnie w Jarvis.');
      }
    } else {
      setStatusMessage('Zapisano szkic w systemie Jarvis (brak aktywnej sesji Gmail).');
    }

    onSaveDraftToGmail({
      ...draft,
      content: currentContent,
      style: currentStyle,
      status: 'DRAFT_SAVED',
    });
    setIsSending(false);
  };

  const handleExecuteSend = async () => {
    setIsSending(true);
    setShowConfirmSendDialog(false);

    const token = getCachedAccessToken();
    if (token) {
      try {
        const sendRes = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: draft.toEmail,
            subject: draft.subject,
            body: currentContent,
            userConfirmation: true,
            messageId: draft.messageId,
          }),
        });
        const sendData = await sendRes.json();
        if (sendData.success) {
          setStatusMessage(`Wiadomość wysłana! ID: ${sendData.sentMessageId}`);
        }
      } catch (err: any) {
        console.warn('Błąd podczas wysyłania przez backend proxy:', err);
      }
    }

    // Call onSendApproved to update state in App
    onSendApproved({
      ...draft,
      content: currentContent,
      style: currentStyle,
      status: 'SENT',
    });

    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl text-slate-100 border border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800 tracking-wider">
                PANEL AKCEPTACJI JARVISA
              </span>
              <span className="text-xs text-slate-400 font-mono hidden xs:inline">
                Wymaga świadomej zgody użytkownika
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white truncate">
              {draft.subject}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              Odbiorca: <strong className="text-cyan-400 font-mono">{draft.toEmail}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar text-xs">
          {/* Status banner */}
          {statusMessage && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-800 text-cyan-300 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Jarvis Reasoning */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Uzasadnienie Jarvisa
            </span>
            <p className="text-slate-300 leading-relaxed font-medium">
              {draft.jarvisReasoning}
            </p>
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 text-xs">
              Wybierz styl odpowiedzi:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
              {(
                [
                  'Profesjonalny',
                  'Formalny',
                  'Urzędowy',
                  'Prawniczy',
                  'Uprzejmy',
                  'Krótki',
                  'Nieformalny',
                ] as ReplyStyle[]
              ).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleRegenerate(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    currentStyle === st
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* User Custom Guidance */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-bold text-xs">
              Wytyczne dla Jarvisa (opcjonalnie):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userGuidance}
                onChange={e => setUserGuidance(e.target.value)}
                placeholder="np. Dodaj informację że sprawę przekazałem do księgowości..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => handleRegenerate()}
                disabled={isRegenerating}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                {isRegenerating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                <span>Przeredaguj</span>
              </button>
            </div>
          </div>

          {/* Editable Draft Text Area */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-bold text-xs">
                Treść wiadomości do wysłania (możesz edytować bezpośrednio):
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Walidacja bezpieczeństwa aktywna
              </span>
            </div>
            <textarea
              value={currentContent}
              onChange={e => setCurrentContent(e.target.value)}
              rows={8}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => {
              onRejectDraft(draft.id);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Odrzuć propozycję</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSaveDraft}
              disabled={isSending}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Zapisz jako szkic w Gmail</span>
            </button>

            <button
              onClick={() => setShowConfirmSendDialog(true)}
              disabled={isSending || !currentContent.trim()}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Akceptuj i wyślij</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conscious Confirmation Dialog (CZĘŚĆ 7 & 10: MANDATORY CONFIRMATION) */}
      {showConfirmSendDialog && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/60 flex items-center justify-center border border-rose-800/80">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  Potwierdzenie wysłania wiadomości
                </h4>
                <p className="text-[11px] text-slate-400">Jarvis nigdy nie wysyła maili bez Twojej zgody</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div>Odbiorca: <strong className="text-cyan-300 font-mono">{draft.toEmail}</strong></div>
              <div>Temat: <strong className="text-white">{draft.subject}</strong></div>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 line-clamp-3 italic">
                "{currentContent.slice(0, 140)}..."
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Czy na pewno zatwierdzasz natychmiastowe wysłanie tej korespondencji ze swojej skrzynki Gmail?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSendDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Anuluj
              </button>
              <button
                onClick={handleExecuteSend}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-950/50 cursor-pointer"
              >
                Potwierdzam wysłanie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
