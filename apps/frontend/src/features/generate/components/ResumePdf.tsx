import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { GeneratedResume, ResumeSection } from '../types';

Font.registerHyphenationCallback(word => [word]);

const C = {
  text: '#1a1a1a',
  muted: '#6b7280',
  accent: '#2563eb',
  border: '#d4d4d8',
  bg: '#ffffff',
};

// Tuned against a full senior CV (see __tests__/resume.fixture.ts), which the
// accompanying test holds to two pages. Line height buys readability and block
// margins pay for it: at this content volume 1.42 fits and 1.46 spills onto a
// third page, so change these together and re-run the test.
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 36,
    paddingVertical: 28,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    lineHeight: 1.42,
    color: C.text,
  },

  // react-pdf gives a large glyph almost no line box under an inherited
  // lineHeight, so the clearance under the name has to be explicit — otherwise
  // a descender (Сергей, Yuri…) collides with the headline below it.
  name: { fontSize: 23, fontFamily: 'Helvetica-Bold', marginBottom: 12 },
  headline: { fontSize: 12.5, fontFamily: 'Helvetica-Bold', marginBottom: 7 },
  contact: { fontSize: 8.5, color: C.muted, marginBottom: 2 },

  section: { marginBottom: 5 },
  sectionHead: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 3,
    marginBottom: 1,
  },
  sectionRule: { borderBottomWidth: 0.6, borderBottomColor: C.border, marginBottom: 3.5 },

  // NOTE: lineHeight is set once, on `page`, and inherited from there.
  // react-pdf compounds an inherited line height with one re-declared on a
  // child Text — 8.5pt text ended up on a 23.7pt pitch and the CV ran to four
  // pages instead of two. Do not add lineHeight to any style below.
  paragraph: {},

  entryBlock: { marginBottom: 4.5 },
  // Role and company share one bold line, exactly as in the source layout —
  // splitting them cost a line per entry, which is most of a page over a CV.
  entryTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 1.5 },
  entryMeta: { fontSize: 8.5, color: C.muted, marginBottom: 1 },
  entryStack: { fontSize: 8.5, color: C.muted, fontFamily: 'Helvetica-Oblique', marginBottom: 2 },

  bullet: { flexDirection: 'row', marginBottom: 0 },
  bulletDot: { width: 7, fontSize: 8.5, color: C.text },
  bulletText: { flex: 1 },

  // "Frontend    Vue 2/3, Composition API, …" — the label/value grid a skills
  // section falls into when every line is "Label: values".
  gridRow: { flexDirection: 'row', marginBottom: 2 },
  gridLabel: { width: 88, fontFamily: 'Helvetica-Bold', paddingRight: 6 },
  gridValue: { flex: 1 },
});

/** The source layout puts the tech stack on its own italic line under the dates. */
function splitMeta(meta: string): { head: string; stack: string } {
  const match = /(^|\s[·|—-]\s*)stack\s*:/i.exec(meta);
  if (!match) return { head: meta, stack: '' };

  const cut = match.index + (match[1].length || 0);
  return { head: meta.slice(0, match.index).trim(), stack: meta.slice(cut).trim() };
}

const LABELLED_LINE = /^([^:]{2,26}):\s*(.+)$/;

/** A skills-style section: every line is a short label followed by its values. */
function asLabelledRows(items: string[]): Array<[string, string]> | null {
  if (items.length < 3) return null;

  const rows: Array<[string, string]> = [];
  for (const item of items) {
    const match = LABELLED_LINE.exec(item.trim());
    if (!match) return null;
    rows.push([match[1].trim(), match[2].trim()]);
  }
  return rows;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        // wrap={false} keeps a bullet whole: without it react-pdf splits one
        // across a page break and leaves an orphan "•" at the bottom.
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

function SectionBody({ section }: { section: ResumeSection }) {
  switch (section.kind) {
    case 'text':
      return <Text style={s.paragraph}>{section.text}</Text>;

    case 'bullets': {
      const rows = asLabelledRows(section.bullets);
      if (!rows) return <Bullets items={section.bullets} />;

      return (
        <>
          {rows.map(([label, value], i) => (
            <View key={i} style={s.gridRow} wrap={false}>
              <Text style={s.gridLabel}>{label}</Text>
              <Text style={s.gridValue}>{value}</Text>
            </View>
          ))}
        </>
      );
    }

    case 'entries':
      return (
        <>
          {section.entries.map((entry, i) => {
            const { head, stack } = splitMeta(entry.meta);
            return (
              <View key={i} style={s.entryBlock}>
                {/* Header lines stay together so a job never starts alone at
                    the bottom of a page. */}
                <View wrap={false}>
                  <Text style={s.entryTitle}>
                    {entry.subtitle ? `${entry.title} · ${entry.subtitle}` : entry.title}
                  </Text>
                  {head ? <Text style={s.entryMeta}>{head}</Text> : null}
                  {stack ? <Text style={s.entryStack}>{stack}</Text> : null}
                </View>
                <Bullets items={entry.bullets} />
              </View>
            );
          })}
        </>
      );
  }
}

interface Props {
  resume: GeneratedResume;
}

/** Renders whatever sections the resume actually has, in their original order. */
export function ResumePdf({ resume }: Props) {
  return (
    <Document title={`${resume.header.name} — Resume`} author={resume.header.name}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{resume.header.name}</Text>
        {resume.header.title ? <Text style={s.headline}>{resume.header.title}</Text> : null}
        {resume.header.contact
          ? resume.header.contact.split('\n').map((line, i) => (
              <Text key={i} style={s.contact}>
                {line}
              </Text>
            ))
          : null}

        {resume.sections.map((section, i) => (
          // minPresenceAhead stops a heading from being stranded alone at the
          // bottom of a page with its content pushed to the next one.
          <View key={i} style={s.section} minPresenceAhead={44}>
            <Text style={s.sectionHead}>{section.heading}</Text>
            <View style={s.sectionRule} />
            <SectionBody section={section} />
          </View>
        ))}
      </Page>
    </Document>
  );
}
