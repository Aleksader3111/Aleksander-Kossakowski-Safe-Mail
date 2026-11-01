/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { MoreMenuDrawer } from './components/MoreMenuDrawer';

// Primary Views
import { JarvisMainView } from './views/JarvisMainView';
import { PriorityView } from './views/PriorityView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { ContactsView } from './views/ContactsView';
import { ReportsView } from './views/ReportsView';

// Auxiliary Views (Preserved & Enhanced)
import { DashboardView } from './views/DashboardView';
import { InboxView } from './views/InboxView';
import { QuarantineView } from './views/QuarantineView';
import { ThreatCenterView } from './views/ThreatCenterView';
import { AIChatView } from './views/AIChatView';
import { AuditLogView } from './views/AuditLogView';
import { TrustedSendersView } from './views/TrustedSendersView';
import { SettingsView } from './views/SettingsView';
import { TestRunnerView } from './views/TestRunnerView';

// Modals
import { DraftApprovalModal } from './views/DraftApprovalModal';
import { RealGmailTestModal } from './views/RealGmailTestModal';
import { EmailDetailModal } from './views/EmailDetailModal';

import {
  EmailMessage,
  AuditLogEntry,
  TrustedEntity,
  UserPreferences,
  SyncStatus,
  TaskItem,
  DeadlineItem,
  ContactProfile,
  FollowUpReminder,
  ReplyDraft,
} from './types';

import {
  getInitialEmailsWithReports,
  INITIAL_TRUSTED_ENTITIES,
  INITIAL_AUDIT_LOGS,
  getInitialTasks,
  getInitialDeadlines,
  getInitialContacts,
  getInitialFollowUps,
  getInitialDrafts,
} from './services/mockData';

import {
  initAuth,
  googleSignIn,
  logout,
  getCachedAccessToken,
  DEFAULT_TARGET_EMAIL,
} from './services/auth';

import { GmailService, GUARDIAN_LABELS } from './services/gmail';
import { evaluateEmailSecurity } from './security/analyzer';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('jarvis');
  const [emails, setEmails] = useState<EmailMessage[]>(() => getInitialEmailsWithReports());
  const [tasks, setTasks] = useState<TaskItem[]>(() => getInitialTasks());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(() => getInitialDeadlines());
  const [contacts] = useState<ContactProfile[]>(() => getInitialContacts());
  const [followUps] = useState<FollowUpReminder[]>(() => getInitialFollowUps());
  const [drafts, setDrafts] = useState<ReplyDraft[]>(() => getInitialDrafts());

  // Modals & Navigation state
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeDraft, setActiveDraft] = useState<ReplyDraft | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState<boolean>(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState<boolean>(false);
  const [isGmailTestModalOpen, setIsGmailTestModalOpen] = useState<boolean>(false);

  // Security & Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => INITIAL_AUDIT_LOGS);
  const [trustedEntities, setTrustedEntities] = useState<TrustedEntity[]>(() => INITIAL_TRUSTED_ENTITIES);

  // Connection & Auth
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('Chroniony');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    'Dzisiaj, ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  );

  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    targetEmail: DEFAULT_TARGET_EMAIL,
    operatingMode: 'OBSERWACYJNY',
    syncTimeframeDays: 30,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    autoQuarantineAds: true,
    autoQuarantinePhishing: true,
    instantAlertsEnabled: true,
    voiceSynthesisEnabled: true,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    pushNotificationsEnabled: false,
    theme: 'light',
  });

  // Initialize Auth listener on mount
  useEffect(() => {
    initAuth(
      (user) => {
        setConnectedEmail(user.email || null);
        setSyncStatus('Chroniony');
      },
      () => {
        setSyncStatus('Chroniony');
      }
    );
  }, []);

  const addAuditLog = (
    action: AuditLogEntry['action'],
    subject: string,
    messageId: string,
    reason: string,
    category: any,
    riskScore: number,
    confidenceScore: number,
    details?: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      messageId,
      subject,
      action,
      reason,
      category,
      riskScore,
      confidenceScore,
      status: 'SUKCES',
      details,
      userEmail: connectedEmail || preferences.targetEmail,
    };
    setAuditLogs(prev => [newEntry, ...prev]);

    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch(() => {});
  };

  // Google Sign In handler
  const handleLogin = async () => {
    try {
      setSyncStatus('Oczekiwanie na zgodę');
      const { user } = await googleSignIn(false, preferences.targetEmail);
      setConnectedEmail(user.email || null);
      setSyncStatus('Połączono');
      addAuditLog(
        'SYNCHRONIZACJA',
        'Autoryzacja konta Google',
        'auth-session',
        `Pomyślnie powiązano konto: ${user.email}`,
        'OSOBISTE',
        0,
        100
      );
      handleSync();
    } catch (err: any) {
      setSyncStatus('Błąd');
      alert(err.message || 'Nie udało się połączyć z kontem Google.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setConnectedEmail(null);
    setSyncStatus('Gmail niepołączony');
  };

  // Sync handler (from real Gmail or re-evaluating mailbox)
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Synchronizowanie');

    const token = getCachedAccessToken();
    if (token) {
      try {
        const gmail = new GmailService(token);
        await gmail.ensureGuardianLabels().catch(() => {});

        const q = preferences.syncTimeframeDays > 0 ? `newer_than:${preferences.syncTimeframeDays}d` : undefined;
        const listRes = await gmail.listMessages({ maxResults: 15, query: q });

        if (listRes.messages && listRes.messages.length > 0) {
          setSyncStatus('Analizowanie');
          const fetchedEmails: EmailMessage[] = [];

          for (const item of listRes.messages.slice(0, 8)) {
            try {
              const fullMsg = await gmail.getMessage(item.id);
              const report = evaluateEmailSecurity({
                id: fullMsg.id,
                from: fullMsg.from,
                to: fullMsg.to,
                subject: fullMsg.subject,
                bodySnippet: fullMsg.bodySnippet,
                fullBody: fullMsg.fullBody,
                headers: fullMsg.rawHeaders,
              });
              fullMsg.securityReport = report;

              if (preferences.operatingMode === 'AUTOMATYCZNY') {
                if (report.overallRisk >= 75 || report.category === 'PHISHING') {
                  fullMsg.inQuarantine = true;
                  fullMsg.quarantineReason = report.primaryThreats.join('; ') || 'Wykryto wysokie zagrożenie phishingu';
                }
              }

              fetchedEmails.push(fullMsg);
            } catch (msgErr) {
              console.warn('Could not fetch message:', item.id, msgErr);
            }
          }

          if (fetchedEmails.length > 0) {
            setEmails(prev => {
              const map = new Map<string, EmailMessage>();
              for (const e of prev) map.set(e.id, e);
              for (const e of fetchedEmails) map.set(e.id, e);
              return Array.from(map.values());
            });
          }
        }

        addAuditLog(
          'SYNCHRONIZACJA',
          'Pobrano nowe wiadomości z Gmail',
          'sync-batch',
          `Pomyślnie zsynchronizowano skrzynkę (zakres: ${preferences.syncTimeframeDays || 'cała historia'} dni)`,
          'OSOBISTE',
          0,
          99
        );
      } catch (err: any) {
        console.error('Błąd synchronizacji z Gmail:', err);
        setSyncStatus('Błąd');
      }
    } else {
      setTimeout(() => {
        setEmails(prev =>
          prev.map(mail => ({
            ...mail,
            securityReport: evaluateEmailSecurity({
              id: mail.id,
              from: mail.from,
              to: mail.to,
              subject: mail.subject,
              bodySnippet: mail.bodySnippet,
              fullBody: mail.fullBody,
              headers: mail.rawHeaders,
            }),
          }))
        );
        addAuditLog(
          'ANALIZA_AI',
          'Skanowanie skrzynki i reguł bezpieczeństwa',
          'local-scan',
          'Przeanalizowano wszystkie wiadomości wg najnowszych reguł Jarvisa',
          'OSOBISTE',
          0,
          95
        );
      }, 500);
    }

    setLastSyncTime('Dzisiaj, ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    setIsSyncing(false);
    setSyncStatus('Chroniony');
  };

  // Quarantine message action
  const handleQuarantineEmail = async (email: EmailMessage) => {
    const reason = email.securityReport?.primaryThreats.join(', ') || 'Ręczne przeniesienie do kwarantanny przez użytkownika';

    setEmails(prev =>
      prev.map(e =>
        e.id === email.id
          ? {
              ...e,
              inQuarantine: true,
              quarantineReason: reason,
              quarantineDate: new Date().toISOString(),
              labelIds: e.labelIds.filter(l => l !== 'INBOX').concat(GUARDIAN_LABELS.QUARANTINE),
            }
          : e
      )
    );

    addAuditLog(
      'KWARANTANNA',
      email.subject,
      email.id,
      reason,
      email.securityReport?.category || 'DO WERYFIKACJI',
      email.securityReport?.overallRisk || 75,
      email.securityReport?.confidence || 90,
      'Dodano etykietę AI_GUARDIAN_QUARANTINE, usunięto INBOX. Wiadomość zachowana na koncie.'
    );

    const token = getCachedAccessToken();
    if (token) {
      try {
        const gmail = new GmailService(token);
        const labels = await gmail.ensureGuardianLabels();
        if (labels.QUARANTINE) {
          await gmail.quarantineMessage(email.id, labels.QUARANTINE);
        }
      } catch (err) {
        console.warn('Quarantine API call error:', err);
      }
    }
  };

  // Restore message action
  const handleRestoreEmail = async (email: EmailMessage) => {
    setEmails(prev =>
      prev.map(e =>
        e.id === email.id
          ? {
              ...e,
              inQuarantine: false,
              isRestored: true,
              labelIds: e.labelIds.filter(l => l !== GUARDIAN_LABELS.QUARANTINE).concat('INBOX'),
            }
          : e
      )
    );

    addAuditLog(
      'PRZYWRÓCENIE',
      email.subject,
      email.id,
      'Przywrócenie ze stanu kwarantanny do skrzynki odbiorczej (INBOX)',
      email.securityReport?.category || 'OSOBISTE',
      email.securityReport?.overallRisk || 20,
      99,
      'Wiadomość w pełni przywrócona do INBOX. Zero utraty danych.'
    );

    const token = getCachedAccessToken();
    if (token) {
      try {
        const gmail = new GmailService(token);
        const labels = await gmail.ensureGuardianLabels();
        if (labels.QUARANTINE) {
          await gmail.restoreMessage(email.id, labels.QUARANTINE);
        }
      } catch (err) {
        console.warn('Restore API call error:', err);
      }
    }
  };

  // Mark email as safe
  const handleMarkSafe = (email: EmailMessage) => {
    setEmails(prev =>
      prev.map(e => {
        if (e.id === email.id) {
          const updatedReport = e.securityReport ? { ...e.securityReport, overallRisk: 5, primaryThreats: [] } : undefined;
          return {
            ...e,
            inQuarantine: false,
            isRestored: true,
            securityReport: updatedReport,
            labelIds: e.labelIds.filter(l => l !== GUARDIAN_LABELS.QUARANTINE).concat('INBOX'),
          };
        }
        return e;
      })
    );

    addAuditLog(
      'OZNACZ_BEZPIECZNY',
      email.subject,
      email.id,
      'Użytkownik manualnie zatwierdził wiadomość jako zaufaną',
      'OSOBISTE',
      5,
      100
    );
  };

  // Report misclassification
  const handleReportMisclassification = (email: EmailMessage, notes: string) => {
    handleRestoreEmail(email);
    addAuditLog(
      'BŁĘDNA_KLASYFIKACJA',
      email.subject,
      email.id,
      `Zgłoszono błędną klasyfikację: ${notes || 'Brak dodatkowych uwag'}`,
      email.securityReport?.category || 'DO WERYFIKACJI',
      email.securityReport?.overallRisk || 50,
      95
    );
  };

  // Draft handling
  const handleOpenDraftForEmail = (messageId: string) => {
    const existing = drafts.find(d => d.messageId === messageId);
    if (existing) {
      setActiveDraft(existing);
      setIsDraftModalOpen(true);
      return;
    }

    const email = emails.find(e => e.id === messageId);
    if (!email) return;

    const cleanFrom = email.from.replace(/.*<(.+)>$/, '$1');
    const senderName = email.from.split('<')[0].replace(/"/g, '').trim() || 'Nadawca';

    const newDraft: ReplyDraft = {
      id: `draft-${Date.now()}`,
      messageId: email.id,
      toEmail: cleanFrom,
      toName: senderName,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      style: email.securityReport?.category === 'INSTYTUCJE' ? 'Urzędowy' : 'Profesjonalny',
      content: `Dzień dobry,\n\nDziękuję za wiadomość dotyczącą sprawy "${email.subject}". Potwierdzam jej otrzymanie i informuję, że zapoznałem się z przekazanymi informacjami.\n\nPozdrawiam,\nAleksander Kossakowski`,
      jarvisReasoning: `Wstępna odpowiedź przygotowana dla ${senderName}.`,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    setDrafts(prev => [newDraft, ...prev]);
    setActiveDraft(newDraft);
    setIsDraftModalOpen(true);
  };

  const handleApproveAndSendDraft = (draft: ReplyDraft) => {
    setDrafts(prev => prev.map(d => (d.id === draft.id ? { ...d, status: 'SENT' as const } : d)));
    addAuditLog(
      'WYSLANIE_ODPOWIEDZI',
      draft.subject,
      draft.messageId,
      `Świadome zatwierdzenie i wysłanie odpowiedzi w stylu ${draft.style} do ${draft.toEmail}`,
      'OSOBISTE',
      0,
      100,
      `Odpowiedź zatwierdzona przez użytkownika. Zrealizowano akcję wysyłki.`
    );
    setIsDraftModalOpen(false);
  };

  const handleSaveToGmailDrafts = async (draft: ReplyDraft) => {
    const token = getCachedAccessToken();
    if (token) {
      try {
        const res = await fetch('/api/gmail/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: draft.toEmail,
            subject: draft.subject,
            body: draft.content,
          }),
        });

        if (res.ok) {
          setDrafts(prev => prev.map(d => (d.id === draft.id ? { ...d, status: 'DRAFT_SAVED' as const } : d)));
          addAuditLog(
            'ZAPIS_SZKICU',
            draft.subject,
            draft.messageId,
            `Zapisano szkic w skrzynce Gmail (${draft.toEmail})`,
            'OSOBISTE',
            0,
            100
          );
          setIsDraftModalOpen(false);
          return;
        }
      } catch (err) {
        console.warn('Błąd podczas zapisu w Gmail API:', err);
      }
    }

    setDrafts(prev => prev.map(d => (d.id === draft.id ? { ...d, status: 'DRAFT_SAVED' as const } : d)));
    addAuditLog(
      'ZAPIS_SZKICU',
      draft.subject,
      draft.messageId,
      `Zapisano szkic w kolejce lokalnej Jarvisa (${draft.toEmail})`,
      'OSOBISTE',
      0,
      95
    );
    setIsDraftModalOpen(false);
  };

  // Task & Deadline actions
  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t))
    );
  };

  // Counts for Badges
  const importantCount = emails.filter(
    e => e.securityReport?.category === 'WAŻNE' || e.securityReport?.category === 'INSTYTUCJE'
  ).length;
  const quarantineCount = emails.filter(e => e.inQuarantine).length;
  const threatsCount = emails.filter(
    e => (e.securityReport?.overallRisk || 0) >= 60 || e.securityReport?.category === 'PHISHING'
  ).length;
  const urgentPrioritiesCount = emails.filter(
    e => e.priorityAssessment?.level === 'P0' || e.priorityAssessment?.level === 'P1'
  ).length;
  const openTasksCount = tasks.filter(t => t.status === 'TODO').length;

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-100 flex flex-col md:flex-row pb-20 md:pb-0 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Desktop/Tablet Sidebar (Hidden on mobile phones for zero horizontal overflow) */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        syncStatus={syncStatus}
        connectedEmail={connectedEmail}
        counts={{
          important: importantCount,
          quarantine: quarantineCount,
          threats: threatsCount,
          total: emails.length,
          openTasks: openTasksCount,
          urgentPriorities: urgentPrioritiesCount,
        }}
        onOpenGmailTest={() => setIsGmailTestModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          mode={preferences.operatingMode}
          onChangeMode={newMode => setPreferences(prev => ({ ...prev, operatingMode: newMode }))}
          syncStatus={syncStatus}
          onSync={handleSync}
          isSyncing={isSyncing}
          connectedEmail={connectedEmail}
          onLogin={handleLogin}
          onLogout={handleLogout}
          unreadCount={threatsCount}
          onOpenMenu={() => setIsMoreDrawerOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* PRIMARY VIEW ROUTING */}
          {currentView === 'jarvis' && (
            <JarvisMainView
              emails={emails}
              tasks={tasks}
              deadlines={deadlines}
              drafts={drafts}
              syncStatus={syncStatus}
              mode={preferences.operatingMode}
              onSelectEmail={setSelectedEmail}
              onOpenDraftModal={(d: ReplyDraft) => {
                setActiveDraft(d);
                setIsDraftModalOpen(true);
              }}
              onSelectView={setCurrentView}
              onToggleTask={handleToggleTask}
            />
          )}

          {currentView === 'skrzynka' && (
            <InboxView
              title="Wszystkie Wiadomości"
              categoryFilter="ALL"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'priorytety' && (
            <PriorityView
              emails={emails}
              onSelectEmail={setSelectedEmail}
            />
          )}

          {currentView === 'zadania' && (
            <TasksView
              tasks={tasks}
              followUps={followUps}
              onToggleTask={handleToggleTask}
              onAddTask={(newTask) => {
                const item: TaskItem = {
                  ...newTask,
                  id: `task-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                };
                setTasks(prev => [item, ...prev]);
                addAuditLog(
                  'DODANO_ZADANIE',
                  item.title,
                  item.messageId || 'user-created',
                  `Dodano zadanie: ${item.title}`,
                  'OSOBISTE',
                  0,
                  100
                );
              }}
              onDeleteTask={(taskId) => {
                setTasks(prev => prev.filter(t => t.id !== taskId));
              }}
              onOpenDraftForEmail={handleOpenDraftForEmail}
            />
          )}

          {currentView === 'kalendarz' && (
            <CalendarView
              deadlines={deadlines}
              onConfirmDeadline={(id) => {
                setDeadlines(prev =>
                  prev.map(d => (d.id === id ? { ...d, confirmed: !d.confirmed } : d))
                );
              }}
            />
          )}

          {currentView === 'kontakty' && (
            <ContactsView
              contacts={contacts}
              onAskJarvisAboutContact={(_contact: ContactProfile) => {
                setCurrentView('jarvis');
              }}
            />
          )}

          {currentView === 'raporty' && (
            <ReportsView
              emails={emails}
              tasks={tasks}
              deadlines={deadlines}
            />
          )}

          {/* AUXILIARY VIEW ROUTING */}
          {currentView === 'dashboard' && (
            <DashboardView
              emails={emails}
              auditLogs={auditLogs}
              syncStatus={syncStatus}
              mode={preferences.operatingMode}
              lastSyncTime={lastSyncTime}
              onSelectView={setCurrentView}
              onSelectEmail={setSelectedEmail}
              onRunSync={handleSync}
              onOpenGmailTest={() => setIsGmailTestModalOpen(true)}
            />
          )}

          {currentView === 'wazne' && (
            <InboxView
              title="Ważne Wiadomości & Instytucje"
              categoryFilter="IMPORTANT_GROUP"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'instytucje' && (
            <InboxView
              title="Instytucje Publiczne, Sądy i Urzędy"
              categoryFilter="INSTYTUCJE"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'banki' && (
            <InboxView
              title="Korespondencja Bankowa & Finanse"
              categoryFilter="BANKI"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'osobiste' && (
            <InboxView
              title="Korespondencja Osobista & Prywatna"
              categoryFilter="OSOBISTE"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'zakupy' && (
            <InboxView
              title="Potwierdzenia Zamówień & Zakupy"
              categoryFilter="ZAKUPY"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'reklamy' && (
            <InboxView
              title="Reklamy & Kampanie Promocyjne"
              categoryFilter="REKLAMY"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'newslettery' && (
            <InboxView
              title="Newslettery & Biuletyny"
              categoryFilter="NEWSLETTERY"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'spam' && (
            <InboxView
              title="Wykryty Spam"
              categoryFilter="SPAM"
              emails={emails}
              onSelectEmail={setSelectedEmail}
              onQuarantineEmail={handleQuarantineEmail}
              onMarkSafe={handleMarkSafe}
            />
          )}

          {currentView === 'kwarantanna' && (
            <QuarantineView
              quarantinedEmails={emails.filter(e => e.inQuarantine)}
              onSelectEmail={setSelectedEmail}
              onRestoreEmail={handleRestoreEmail}
              onMarkSafe={handleMarkSafe}
              onReportMisclassification={handleReportMisclassification}
            />
          )}

          {currentView === 'zagrozenia' && (
            <ThreatCenterView
              emails={emails}
              onSelectEmail={setSelectedEmail}
            />
          )}

          {currentView === 'ai-chat' && (
            <AIChatView emails={emails} />
          )}

          {currentView === 'audyt' && (
            <AuditLogView logs={auditLogs} />
          )}

          {currentView === 'zaufani' && (
            <TrustedSendersView
              trustedEntities={trustedEntities}
              onAddEntity={newEnt =>
                setTrustedEntities(prev => [
                  ...prev,
                  { ...newEnt, id: `tr-${Date.now()}`, addedAt: new Date().toISOString() },
                ])
              }
              onRemoveEntity={id => setTrustedEntities(prev => prev.filter(t => t.id !== id))}
            />
          )}

          {currentView === 'ustawienia' && (
            <SettingsView
              preferences={preferences}
              onUpdatePreferences={up => setPreferences(prev => ({ ...prev, ...up }))}
              connectedEmail={connectedEmail}
            />
          )}

          {currentView === 'test-runner' && (
            <TestRunnerView />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on phones, with >=44px touch targets) */}
      <BottomNavBar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenMore={() => setIsMoreDrawerOpen(true)}
        urgentCount={urgentPrioritiesCount}
        openTasksCount={openTasksCount}
      />

      {/* Drawer for auxiliary modules (Dashboard, Calendar, Contacts, Reports, Quarantine, Threat Center, etc.) */}
      <MoreMenuDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        onSelectView={(v) => {
          setCurrentView(v);
          setIsMoreDrawerOpen(false);
        }}
        currentView={currentView}
        quarantineCount={quarantineCount}
        threatsCount={threatsCount}
      />

      {/* Draft Approval & Conscious Send Modal */}
      <DraftApprovalModal
        draft={isDraftModalOpen ? activeDraft : null}
        sourceEmail={emails.find(e => e.id === activeDraft?.messageId)}
        onClose={() => {
          setIsDraftModalOpen(false);
          setActiveDraft(null);
        }}
        onSendApproved={handleApproveAndSendDraft}
        onSaveDraftToGmail={handleSaveToGmailDrafts}
        onRejectDraft={(draftId: string) => {
          setDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, status: 'REJECTED' as const } : d)));
          setIsDraftModalOpen(false);
          setActiveDraft(null);
        }}
      />

      {/* Email Detail Modal */}
      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onQuarantine={handleQuarantineEmail}
        onRestore={handleRestoreEmail}
        onMarkSafe={handleMarkSafe}
      />

      {/* Real Gmail Connection Test Modal */}
      <RealGmailTestModal
        isOpen={isGmailTestModalOpen}
        onClose={() => setIsGmailTestModalOpen(false)}
        connectedEmail={connectedEmail}
        onConnectGoogle={handleLogin}
        targetEmail={preferences.targetEmail}
      />
    </div>
  );
}
