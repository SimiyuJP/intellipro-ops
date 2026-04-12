import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Deliverable } from '@/types/project';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, X, Check, Pencil, Trash2 } from 'lucide-react';

interface TaskManagerProps {
  roomId: string;
  deliverables: Deliverable[];
}

const PRIORITY_OPTIONS: Deliverable['priority'][] = ['critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS: Deliverable['status'][] = ['not_started', 'in_progress', 'blocked', 'done'];

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <span className="text-health-green">✓</span>;
  if (status === 'blocked') return <span className="text-health-red">✕</span>;
  if (status === 'in_progress') return <span className="text-health-yellow">◉</span>;
  return <span className="text-muted-foreground">○</span>;
}

export function TaskManager({ roomId, deliverables }: TaskManagerProps) {
  const { addDeliverable, updateDeliverable, deleteDeliverable } = useProject();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    owner: '',
    dueDate: '',
    priority: 'medium' as Deliverable['priority'],
    estimatedEffort: '',
  });

  const resetForm = () => {
    setForm({ title: '', description: '', owner: '', dueDate: '', priority: 'medium', estimatedEffort: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const newDeliverable: Deliverable = {
      id: `d-${Date.now()}`,
      title: form.title,
      description: form.description,
      status: 'not_started',
      owner: form.owner || 'Unassigned',
      dueDate: form.dueDate || 'TBD',
      priority: form.priority,
      roomId,
      dependencies: [],
      estimatedEffort: form.estimatedEffort || 'TBD',
    };
    addDeliverable(roomId, newDeliverable);
    resetForm();
  };

  const handleEdit = (d: Deliverable) => {
    setEditingId(d.id);
    setForm({
      title: d.title,
      description: d.description,
      owner: d.owner,
      dueDate: d.dueDate,
      priority: d.priority,
      estimatedEffort: d.estimatedEffort,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.title.trim()) return;
    updateDeliverable(roomId, editingId, {
      title: form.title,
      description: form.description,
      owner: form.owner || 'Unassigned',
      dueDate: form.dueDate || 'TBD',
      priority: form.priority,
      estimatedEffort: form.estimatedEffort || 'TBD',
    });
    resetForm();
  };

  const handleStatusChange = (deliverableId: string, status: Deliverable['status']) => {
    updateDeliverable(roomId, deliverableId, { status });
  };

  return (
    <div className="space-y-3">
      {/* Task list */}
      <div className="space-y-2">
        <AnimatePresence>
          {deliverables.map(d => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg group"
            >
              {editingId === d.id ? (
                <div className="w-full space-y-2">
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="command-input w-full p-2 text-sm font-body"
                    placeholder="Task title"
                  />
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="command-input w-full p-2 text-xs font-body resize-none h-12"
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      value={form.owner}
                      onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                      className="command-input p-1.5 text-xs font-body"
                      placeholder="Owner"
                    />
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="command-input p-1.5 text-xs font-body"
                    />
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as Deliverable['priority'] }))}
                      className="command-input p-1.5 text-xs font-body"
                    >
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      value={form.estimatedEffort}
                      onChange={e => setForm(f => ({ ...f, estimatedEffort: e.target.value }))}
                      className="command-input p-1.5 text-xs font-body"
                      placeholder="Effort (e.g. 3 days)"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancel</button>
                    <button onClick={handleSaveEdit} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-display hover:bg-primary/90">
                      <Check className="w-3 h-3 inline mr-1" />Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 flex-1">
                    <button onClick={() => handleStatusChange(d.id, d.status === 'done' ? 'not_started' : 'done')} className="mt-0.5">
                      <StatusIcon status={d.status} />
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${d.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{d.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Owner: <span className="text-foreground">{d.owner}</span></span>
                        <span>Due: <span className="text-foreground">{d.dueDate}</span></span>
                        <span>Effort: {d.estimatedEffort}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Status selector */}
                    <select
                      value={d.status}
                      onChange={e => handleStatusChange(d.id, e.target.value as Deliverable['status'])}
                      className={`text-[10px] font-display px-1.5 py-0.5 rounded capitalize border-0 bg-transparent cursor-pointer ${
                        d.status === 'blocked' ? 'text-health-red' :
                        d.status === 'done' ? 'text-health-green' :
                        d.status === 'in_progress' ? 'text-health-yellow' :
                        'text-muted-foreground'
                      }`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${
                      d.priority === 'critical' ? 'text-health-red bg-health-red/10' :
                      d.priority === 'high' ? 'text-health-yellow bg-health-yellow/10' :
                      'text-muted-foreground bg-muted/50'
                    }`}>
                      {d.priority}
                    </span>
                    <button onClick={() => handleEdit(d)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteDeliverable(roomId, d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-health-red transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add task form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-primary/20 rounded-lg p-3 space-y-2 bg-primary/5">
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="command-input w-full p-2 text-sm font-body"
                placeholder="Task title *"
                autoFocus
              />
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="command-input w-full p-2 text-xs font-body resize-none h-12"
                placeholder="Description"
              />
              <div className="grid grid-cols-4 gap-2">
                <input
                  value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  className="command-input p-1.5 text-xs font-body"
                  placeholder="Owner"
                />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="command-input p-1.5 text-xs font-body"
                />
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as Deliverable['priority'] }))}
                  className="command-input p-1.5 text-xs font-body"
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  value={form.estimatedEffort}
                  onChange={e => setForm(f => ({ ...f, estimatedEffort: e.target.value }))}
                  className="command-input p-1.5 text-xs font-body"
                  placeholder="Effort (e.g. 3 days)"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={!form.title.trim()}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-display hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3 inline mr-1" />Add Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && !editingId && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full border border-dashed border-border hover:border-primary/50 rounded-lg p-2.5 text-xs text-muted-foreground hover:text-primary font-display transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      )}
    </div>
  );
}
