import React from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Link,
  Paperclip,
  FileCode,
  Globe,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { EmailMessage } from '../types';

interface ThreatCenterViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
}

export const ThreatCenterView: React.FC<ThreatCenterViewProps> = ({ emails, onSelectEmail }) => {
  const threatEmails = emails.filter(
    e => (e.securityReport?.overallRisk || 0) >= 40 || e.inQuarantine
  );

  // Statistics for stages
  let spfFails = 0;
  let dkimFails = 0;
  let typosquattingCount = 0;
  let dangerousAttachmentsCount = 0;
  let promptInjectionsCount = 0;
  let suspiciousLinksCount = 0;

  emails.forEach(e => {
    const r = e.securityReport;
    if (!r) return;
    if (r.stageB_Headers.spf === 'FAIL') spfFails++;
    if (r.stageB_Headers.dkim === 'FAIL') dkimFails++;
    if (r.stageA_Sender.hasHomographOrSuspiciousChars) typosquattingCount++;
    if (r.stageE_Attachments.hasExecutableOrMacro) dangerousAttachmentsCount++;
    if (r.stageC_Content.promptInjectionDetected) promptInjectionsCount++;
    suspiciousLinksCount += r.stageD_Links.suspiciousLinks.length;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Centrum Analizy Zagrożeń</h2>
            <p className="text-xs text-slate-300">Wielopoziomowa telemetria wektorów ataku i detekcja socjotechniki</p>
          </div>
        </div>
      </div>

      {/* 5 Stages Overview Cards (CZĘŚĆ 5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Etap A */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Globe className="w-4 h-4" />
              Etap A: Nadawca
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {typosquattingCount} alertów
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Badanie wieku domeny, homografów punycode, typosquattingu banków i zgodności Reply-To.
          </p>
        </div>

        {/* Etap B */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-blue-400">
              <FileCode className="w-4 h-4" />
              Etap B: Nagłówki
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {spfFails + dkimFails} błędów
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Kryptograficzna walidacja SPF, podpisów DKIM, polityki DMARC oraz przeskoków Received.
          </p>
        </div>

        {/* Etap C */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              Etap C: Treść
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {promptInjectionsCount} injection
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Wykrywanie wyłudzania haseł/BLIK, presji czasu, podszywania pod sądy oraz prompt injection.
          </p>
        </div>

        {/* Etap D */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Link className="w-4 h-4" />
              Etap D: Linki
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {suspiciousLinksCount} podejrzanych
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Inspekcja skracaczy linków, surowych adresów IP zamiast domen i niezgodności anchor-text.
          </p>
        </div>

        {/* Etap E */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-red-400">
              <Paperclip className="w-4 h-4" />
              Etap E: Załączniki
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              {dangerousAttachmentsCount} plików .exe
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Blokowanie plików .exe/.scr, podwójnych rozszerzeń (.pdf.exe) oraz ochrona przed ZIP bombami.
          </p>
        </div>
      </div>

      {/* Threats Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white">
          Wiadomości zidentyfikowane jako zagrożenia ({threatEmails.length})
        </h3>

        <div className="space-y-3">
          {threatEmails.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nie wykryto aktywnych zagrożeń w analizowanym zbiorze wiadomości.
            </div>
          ) : (
            threatEmails.map(mail => {
              const r = mail.securityReport;
              const risk = r?.overallRisk || 0;
              return (
                <div
                  key={mail.id}
                  onClick={() => onSelectEmail(mail)}
                  className="p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        RYZYKO {risk}/100
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-md">
                        {mail.subject}
                      </span>
                      {mail.inQuarantine && (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold">
                          KWARANTANNA
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      Nadawca: <span className="text-slate-300 font-mono">{mail.from}</span>
                    </p>

                    {/* Threat Details */}
                    {r?.primaryThreats && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {r.primaryThreats.map((threat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-red-950/40 border border-red-800/40 text-red-300 font-medium"
                          >
                            ⚠ {threat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectEmail(mail);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 shrink-0 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zbadaj wektory</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
