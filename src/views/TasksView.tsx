import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { TaskItem, FollowUpReminder, PriorityLevel } from '../types';

interface TasksViewProps {
  tasks: TaskItem[];
  followUps: FollowUpReminder[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenDraftForEmail: (messageId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  followUps,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenDraftForEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'followups'>('tasks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('P2');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      messageId: 'custom-task',
      title: newTitle.trim(),
      description: newDesc.trim() || 'Zadanie dodane manualnie',
      deadline: newDeadline.trim() || undefined,
      priority: newPriority,
      status: 'TODO',
      sourceSender: 'Własne zadanie',
      sourceSubject: newTitle.trim(),
    });

    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setShowAddModal(false);
  };

  const openTasks = tasks.filter(t => t.status !== 'DONE');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Centrum Zadań & Oczekujące Odpowiedzi
              </h2>
              <p className="text-xs text-slate-400">
                Sprawy wyekstrahowane z korespondencji oraz monitoring korespondencji bez odpowiedzi
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-950/40 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj zadanie</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Zadania z Korespondencji ({openTasks.length} otwartych)
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'followups'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Oczekujące Odpowiedzi ({followUps.length})
        </button>
      </div>

      {/* TAB 1: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {openTasks.length === 0 ? (
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center">
                <p className="text-xs text-slate-500">Wszystkie zadania zostały wykonane.</p>
              </div>
            ) : (
              openTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md flex items-start justify-between gap-3 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 w-5 h-5 rounded-lg border-2 border-slate-700 hover:border-cyan-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      aria-label="Oznacz jako wykonane"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            task.priority === 'P0'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : task.priority === 'P1'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                      </div>

                      <p className="text-xs text-slate-400">{task.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                        {task.deadline && (
                          <span className="font-semibold text-cyan-400">Termin: {task.deadline}</span>
                        )}
                        <span className="truncate">Źródło: {task.sourceSender}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Usuń zadanie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Completed Tasks section */}
          {doneTasks.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-500 block mb-2">Wykonane zadania ({doneTasks.length})</span>
              <div className="space-y-2 opacity-60">
                {doneTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 line-through text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{task.title}</span>
                    </div>
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Przywróć
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOLLOW-UPS */}
      {activeTab === 'followups' && (
        <div className="space-y-3">
          {followUps.map(fu => (
            <div
              key={fu.id}
              className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    Czeka {fu.daysWaiting} {fu.daysWaiting === 1 ? 'dzień' : 'dni'}
                  </span>
                  <span className="text-xs font-bold text-white">{fu.subject}</span>
                </div>
                <p className="text-xs text-slate-400">Kontakt: {fu.contact}</p>
                <p className="text-[11px] text-cyan-400 font-medium font-mono">
                  Sugerowany termin odpowiedzi: {fu.suggestedReplyDeadline}
                </p>
              </div>

              <button
                onClick={() => onOpenDraftForEmail(fu.messageId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Odpowiedz teraz</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Nowe Zadanie w Jarvis
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tytuł zadania:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="np. Przygotować dokumentację dla sądu"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Opis / szczegóły:</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Krótki opis zadania..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Priorytet:</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none text-white"
                  >
                    <option value="P0">P0 – Krytyczne</option>
                    <option value="P1">P1 – Pilne</option>
                    <option value="P2">P2 – Ważne</option>
                    <option value="P3">P3 – Normalne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Termin (opcjonalnie):</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    placeholder="np. do 15 listopada"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  Zapisz zadanie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
