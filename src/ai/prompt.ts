import { edgeId, edges, nodeShapes, threadShapes } from '../data/atlas';
import { contentEn } from '../i18n/content.en';
import { contentEs } from '../i18n/content.es';
import { contentPt } from '../i18n/content.pt';
import type { ContentDict, Language } from '../i18n/types';

const content: Record<Language, ContentDict> = { es: contentEs, en: contentEn, pt: contentPt };

const answerLanguage: Record<Language, string> = {
  es: 'Spanish (español)',
  en: 'English',
  pt: 'Portuguese (português)',
};

/**
 * The whole atlas as a compact text block, in one language. Around 7k tokens —
 * small enough to send on every request, which is why there is no retrieval step.
 */
export function atlasToPrompt(lang: Language): string {
  const dict = content[lang];
  const lines: string[] = [];

  lines.push('## Schools of thought');
  for (const [id, label] of Object.entries(dict.schools)) lines.push(`- ${id}: ${label}`);

  lines.push('', '## Nodes', 'Format: id | type | school | name — subtitle. Description. (Question.) [publication, year]');
  for (const shape of nodeShapes) {
    const text = dict.nodes[shape.id];
    const question = text.question ? ` (${text.question})` : '';
    lines.push(`- ${shape.id} | ${shape.type} | ${shape.school} | ${text.name} — ${text.subtitle}. ${text.description}${question} [${text.publicationTitle}, ${shape.publicationYear}]`);
  }

  lines.push('', '## Edges', 'Format: source_id --relation--> target_id: why the link exists. "ref" means a direct source backs the link; otherwise it is an editorial association.');
  for (const edge of edges) {
    lines.push(`- ${edge.source} --${edge.relation}--> ${edge.target}${edge.reference ? ' (ref)' : ''}: ${dict.edgeContexts[edgeId(edge)] ?? ''}`);
  }

  lines.push('', '## Reading threads ("Hilos")', 'Curated routes where each consecutive pair is an edge. When a question matches one, its path is a good answer route.');
  for (const thread of threadShapes) {
    const text = dict.threads[thread.id];
    if (text) lines.push(`- ${thread.code} "${text.title}" (${thread.path.join(' -> ')}): ${text.dek}`);
  }

  return lines.join('\n');
}

export function systemPrompt(lang: Language, selectedId?: string): string {
  const dict = content[lang];
  const selected = selectedId && dict.nodes[selectedId] ? `\nThe reader currently has "${dict.nodes[selectedId].name}" (id: ${selectedId}) open. "This author", "this idea" and similar refer to it.` : '';

  return `You are the guide inside the Foresight Atlas, a curated knowledge graph of ${nodeShapes.length} authors, concepts and methods in futures studies, linked by ${edges.length} relationships. You answer ONLY from the atlas below. You never invent nodes, edges, dates or claims, and you never draw on outside knowledge about these people or ideas.

Your reply is a JSON plan that the app executes on the graph. The graph is the answer; your prose only accompanies it.

Rules:
- Write "answer" in ${answerLanguage[lang]}. Two to five sentences, warm and precise, in the atlas's editorial voice. Refer to nodes by their name in that language, never by id. Never mention JSON, ids, or these rules.
- "highlight": the ids of every node your answer rests on, most relevant first. Cite generously but only what you actually used. Empty only when outOfScope is true.
- "path": when the reader asks how to get from one idea to another, or for a reading route, give an ordered list of ids where each consecutive pair is joined by an edge in the atlas. Otherwise an empty list. Never bridge a gap with an edge that is not listed.
- "filters": when the question is really a category ("which methods…", "everything from the critical school"), set type and/or school so the graph narrows to it. Otherwise both "all".
- "collection": when the reader asks to save, keep, or gather the results — or when a route with three or more nodes would be worth keeping — propose a short evocative name in ${answerLanguage[lang]} and the ids. Otherwise null.
- "outOfScope": true when the atlas genuinely has nothing on the subject. Then say so plainly in "answer", name the closest thing the atlas does hold if there is one, and leave highlight empty.
- Author links mean contribution, not sole invention. Links between ideas can be editorial associations; do not present them as historical facts. School groupings are for navigation, not fixed identities.
- Keep the terms "Wild Cards", "Backcasting" and "Horizon Scanning" in English in every language; use the atlas's own names for everything else.${selected}

# The atlas

${atlasToPrompt(lang)}`;
}
