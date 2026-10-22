import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, BookOpen, Check, Focus, X } from 'lucide-react';
import { palette, type AtlasNode } from '../data/atlas';
import { format, useI18n } from '../i18n';
import NodeMark from './NodeMark';

interface DetailPanelProps {
  node: AtlasNode;
  onSelect: (node: AtlasNode) => void;
  onClose: () => void;
  onFocus: (node: AtlasNode) => void;
  onSave: (node: AtlasNode) => void;
  saved: boolean;
}

export default function DetailPanel({ node, onSelect, onClose, onFocus, onSave, saved }: DetailPanelProps) {
  const { ui, schools, typeLabels, getConnections, blueprints } = useI18n();
  const [allConnections, setAllConnections] = useState(false);
  const connections = getConnections(node.id);
  const visible = allConnections ? connections : connections.slice(0, 4);
  const color = palette[node.type];

  useEffect(() => { setAllConnections(false); }, [node.id]);

  return <aside className="detail-panel" aria-label={`${node.name} — ${typeLabels[node.type]}`}>
    <div className="detail-topline"><span className="entity-eyebrow" style={{ color: color.ink }}><i style={{ background: color.stroke }} />{typeLabels[node.type]}</span><button className="icon-button" aria-label={ui.detail.close} onClick={onClose}><X size={17} /></button></div>
    <div className="detail-scroll" key={node.id}>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <div className="profile-heading"><NodeMark node={node} size={53} /><h2>{node.name}</h2></div>
        <p className="profile-subtitle">{node.subtitle}</p>
        <p className="profile-school">{schools[node.school]}</p>
        <p className="profile-description">{node.description}</p>
        <button className="text-button focus-button" onClick={() => onFocus(node)}><Focus size={15} />{ui.detail.focusOn} {typeLabels[node.type].toLowerCase()}<ArrowUpRight size={14} /></button>
        {blueprints.has(node.id) && <button className="blueprint-link" onClick={() => { window.location.hash = `#/instrumento?node=${node.id}&blueprint=1`; }}><span>{ui.inst.bpKicker} · {blueprints.get(node.id)!.code}</span><strong>{ui.inst.blueprintInInstrument}</strong><ArrowUpRight size={14} /></button>}

        <section className="detail-connections">
          <div className="section-label"><h3>{node.type === 'author' ? ui.detail.connectedIdeas : ui.detail.connectedThreads}</h3><span>{connections.length}</span></div>
          <div>{visible.map((connection) => <button className="connection-row" key={connection.node.id} onClick={() => onSelect(connection.node)}>
            <span className="connection-dot" style={{ background: palette[connection.node.type].fill, borderColor: palette[connection.node.type].stroke }} />
            <span className="connection-copy"><strong>{connection.node.name}</strong><small>{connection.relation}</small>{connection.context && <small className="connection-context">{connection.context}</small>}</span>
            <ArrowRight size={14} />
          </button>)}</div>
          {connections.length > 4 && <button className="text-button more-connections" onClick={() => setAllConnections(!allConnections)}>{allConnections ? ui.detail.showFewer : format(ui.detail.viewAll, { count: connections.length })}<ArrowDown size={13} className={allConnections ? 'rotate-arrow' : ''} /></button>}
        </section>

        <section className="detail-reading"><h3>{ui.detail.startHere}</h3><a className="publication-link" href={node.publication.url} target="_blank" rel="noreferrer"><span className="book-thumbnail"><BookOpen size={21} strokeWidth={1.3} /></span><span><strong>{node.publication.title}</strong><small>{node.publication.kind} / {node.publication.year}</small></span><ArrowUpRight size={15} /></a></section>
        {node.question && <section className="reflection"><span>{ui.detail.questionLabel}</span><p>{node.question}</p></section>}
        <a href={node.source} className="profile-source" target="_blank" rel="noreferrer">{node.type === 'author' ? ui.detail.moreAboutAuthor : ui.detail.exploreSource}<ArrowUpRight size={13} /></a>
      </motion.div>
    </div>
    <div className="detail-bottom"><button className={`button button-primary save-button ${saved ? 'is-saved' : ''}`} onClick={() => onSave(node)}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? ui.detail.savedToCollection : ui.detail.saveToCollection}</button><span>{ui.detail.footer}</span></div>
  </aside>;
}
