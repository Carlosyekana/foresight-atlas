import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, FolderPlus, RotateCcw, Route, Sparkles, Square, X } from 'lucide-react';
import { ask, AskFailure, askEnabled } from '../ai/client';
import type { AskPlan, AskTurn } from '../ai/contract';
import type { AtlasNode } from '../data/atlas';
import { useI18n } from '../i18n';
import NodeMark from './NodeMark';

interface Message {
  id: number;
  role: 'user' | 'model' | 'error';
  text: string;
  plan?: AskPlan;
}

interface AskPanelProps {
  selectedId: string | null;
  onClose: () => void;
  onSelect: (node: AtlasNode) => void;
  /** Called once per answer so the graph reflects it immediately. */
  onPlan: (plan: AskPlan) => void;
  onShowPath: (ids: string[]) => void;
  onSaveCollection: (name: string, ids: string[]) => void;
}

export default function AskPanel({ selectedId, onClose, onSelect, onPlan, onShowPath, onSaveCollection }: AskPanelProps) {
  const { lang, ui, nodeById, typeLabels } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const selected = selectedId ? nodeById.get(selectedId) : undefined;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history: AskTurn[] = messages.filter((m): m is Message & { role: 'user' | 'model' } => m.role !== 'error').map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }]);
    setInput('');
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const plan = await ask({ lang, question: text, history, selectedId: selectedId ?? undefined, signal: controller.signal });
      setMessages((current) => [...current, { id: Date.now(), role: 'model', text: plan.answer, plan }]);
      onPlan(plan);
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = error instanceof AskFailure ? error.code : 'unavailable';
      setMessages((current) => [...current, { id: Date.now(), role: 'error', text: ui.ask.errors[code] }]);
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; setBusy(false); }
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void submit(input); }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(input); }
  }
  function routeFromHere() {
    if (!selected) return;
    setInput(`${selected.name} → `);
    inputRef.current?.focus();
  }

  return <aside className="ask-panel" aria-label={ui.ask.title}>
    <div className="detail-topline">
      <span className="entity-eyebrow ask-eyebrow"><Sparkles size={11} />{ui.ask.eyebrow}</span>
      <span className="ask-topline-actions">
        {messages.length > 0 && <button className="icon-button" aria-label={ui.ask.clear} title={ui.ask.clear} onClick={() => { stop(); setMessages([]); }}><RotateCcw size={14} /></button>}
        <button className="icon-button" aria-label={ui.ask.close} onClick={onClose}><X size={17} /></button>
      </span>
    </div>

    <div className="ask-log" ref={logRef} role="log" aria-live="polite">
      {!askEnabled && <p className="ask-notice">{ui.ask.offline}</p>}
      {askEnabled && messages.length === 0 && <div className="ask-intro">
        <h2>{ui.ask.title}</h2>
        <p>{ui.ask.intro}</p>
        <div className="ask-starters">
          {selected && <button className="ask-starter ask-starter-route" onClick={routeFromHere}><Route size={13} />{ui.ask.routeFrom}</button>}
          {ui.ask.starters.map((starter) => <button key={starter} className="ask-starter" onClick={() => void submit(starter)}>{starter}<ArrowRight size={12} /></button>)}
        </div>
      </div>}

      {messages.map((message) => {
        if (message.role === 'user') return <div key={message.id} className="ask-message ask-user"><p>{message.text}</p></div>;
        if (message.role === 'error') return <div key={message.id} className="ask-message ask-error" role="alert"><p>{message.text}</p></div>;
        const plan = message.plan!;
        const highlighted = plan.highlight.map((id) => nodeById.get(id)).filter((node): node is AtlasNode => !!node);
        const path = plan.path.map((id) => nodeById.get(id)).filter((node): node is AtlasNode => !!node);
        const filtersActive = plan.filters.type !== 'all' || plan.filters.school !== 'all';
        return <motion.div key={message.id} className="ask-message ask-model" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {plan.outOfScope && <span className="ask-scope-tag">{ui.ask.outOfScope}</span>}
          <p>{message.text}</p>
          {highlighted.length > 0 && <div className="ask-section">
            <span className="ask-section-label">{ui.ask.highlightedLabel}</span>
            <div className="ask-chips">{highlighted.map((node) => <button key={node.id} className="ask-chip" onClick={() => onSelect(node)} title={`${node.name} — ${typeLabels[node.type]}`}><NodeMark node={node} size={22} /><span>{node.name}</span></button>)}</div>
          </div>}
          {path.length > 1 && <div className="ask-section">
            <span className="ask-section-label">{ui.ask.pathLabel}</span>
            <ol className="ask-path">{path.map((node, index) => <li key={node.id}><button onClick={() => onSelect(node)}><i>{index + 1}</i>{node.name}</button></li>)}</ol>
            <button className="text-button" onClick={() => onShowPath(plan.path)}><Route size={13} />{ui.ask.showPath}</button>
          </div>}
          {filtersActive && <p className="ask-filters-note">{ui.ask.filtersApplied}</p>}
          {plan.collection && <button className="button button-secondary ask-collection" onClick={() => onSaveCollection(plan.collection!.name, plan.collection!.ids)}><FolderPlus size={14} />{ui.ask.saveCollection}<strong>{plan.collection.name}</strong></button>}
        </motion.div>;
      })}

      {busy && <div className="ask-message ask-model ask-thinking" aria-busy="true"><span /><span /><span /><em>{ui.ask.thinking}</em></div>}
    </div>

    <form className="ask-compose" onSubmit={onSubmit}>
      <textarea ref={inputRef} className="ask-input" value={input} rows={2} maxLength={600} placeholder={ui.ask.placeholder} aria-label={ui.ask.placeholder} disabled={!askEnabled} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} />
      {busy
        ? <button type="button" className="button button-secondary ask-send" onClick={stop} aria-label={ui.ask.stop} title={ui.ask.stop}><Square size={13} /></button>
        : <button type="submit" className="button button-primary ask-send" disabled={!askEnabled || !input.trim()} aria-label={ui.ask.send} title={ui.ask.send}><CornerDownLeft size={14} /></button>}
      <span className="ask-disclaimer">{ui.ask.disclaimer}</span>
    </form>
  </aside>;
}
