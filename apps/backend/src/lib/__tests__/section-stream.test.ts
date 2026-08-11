import { describe, expect, it } from 'vitest';
import { SectionStream, type SectionEvent } from '../section-stream.js';

type Target = 'resume' | 'coverLetter';

const MARKERS = [
  { target: 'resume' as const, marker: '<<<SECTION:resume>>>' },
  { target: 'coverLetter' as const, marker: '<<<SECTION:cover_letter>>>' },
];
const END = '<<<END>>>';

function run(chunks: string[]): Array<SectionEvent<Target>> {
  const events: Array<SectionEvent<Target>> = [];
  const stream = new SectionStream<Target>(MARKERS, END, e => events.push(e));
  for (const chunk of chunks) stream.push(chunk);
  stream.end();
  return events;
}

const closes = (events: Array<SectionEvent<Target>>) =>
  events.filter(e => e.type === 'close') as Array<Extract<SectionEvent<Target>, { type: 'close' }>>;

describe('SectionStream', () => {
  it('splits sections and reports each one when it closes', () => {
    const events = run([
      '<<<SECTION:resume>>>\n{"a":1}\n<<<SECTION:cover_letter>>>\nDear team\n<<<END>>>',
    ]);

    expect(events.filter(e => e.type === 'start').map(e => e.target)).toEqual([
      'resume',
      'coverLetter',
    ]);
    expect(closes(events).map(e => [e.target, e.raw.trim()])).toEqual([
      ['resume', '{"a":1}'],
      ['coverLetter', 'Dear team'],
    ]);
  });

  it('reassembles a marker split across chunk boundaries', () => {
    const events = run([
      '<<<SECTION:res',
      'ume>>>\nbody one\n<<<SEC',
      'TION:cover_letter>>>\nbody two\n<<<E',
      'ND>>>',
    ]);

    expect(closes(events).map(e => [e.target, e.raw.trim()])).toEqual([
      ['resume', 'body one'],
      ['coverLetter', 'body two'],
    ]);
  });

  it('never leaks marker text into a section body', () => {
    const events = run(['<<<SECTION:cover_letter>>>Hello<<<END>>>trailing noise']);

    expect(closes(events)).toEqual([{ type: 'close', target: 'coverLetter', raw: 'Hello' }]);
  });

  it('ignores any preamble emitted before the first marker', () => {
    const events = run(['Here you go:\n\n<<<SECTION:cover_letter>>>Hi<<<END>>>']);

    expect(events.some(e => e.type === 'delta' && e.text.includes('Here you go'))).toBe(false);
    expect(closes(events)[0].raw).toBe('Hi');
  });

  it('closes a truncated final section when the end marker never arrives', () => {
    const events = run(['<<<SECTION:cover_letter>>>Dear team, I ']);

    expect(closes(events)).toEqual([
      { type: 'close', target: 'coverLetter', raw: 'Dear team, I ' },
    ]);
  });

  it('streams deltas that concatenate back into the closed section', () => {
    const events = run(['<<<SECTION:cover_letter>>>', 'Dear ', 'hiring ', 'team', '<<<END>>>']);

    const deltas = events
      .filter(e => e.type === 'delta')
      .map(e => (e as Extract<SectionEvent<Target>, { type: 'delta' }>).text)
      .join('');

    expect(deltas).toBe('Dear hiring team');
    expect(closes(events)[0].raw).toBe('Dear hiring team');
  });
});
