import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

Font.registerHyphenationCallback(word => [word]);

export interface EnhancedResume {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    location: string;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  languages?: string[];
}

const C = {
  text: '#0f172a',
  muted: '#475569',
  accent: '#4f46e5',
  border: '#e2e8f0',
  bg: '#ffffff',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 48,
    paddingVertical: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
  },
  // Header
  name: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  title: { fontSize: 11, color: C.accent, marginBottom: 4 },
  contact: { fontSize: 8, color: C.muted, marginBottom: 16 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: C.accent, marginBottom: 14 },
  // Section
  section: { marginBottom: 14 },
  sectionHead: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionRule: { borderBottomWidth: 0.5, borderBottomColor: C.border, marginBottom: 8 },
  // Summary
  summary: { lineHeight: 1.55, color: C.text },
  // Experience
  jobRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  jobPeriod: { fontSize: 8, color: C.muted },
  jobCompany: { fontSize: 8.5, color: C.muted, marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 2, paddingLeft: 4 },
  bulletDot: { width: 10, color: C.muted, fontSize: 8 },
  bulletText: { flex: 1, lineHeight: 1.4 },
  expBlock: { marginBottom: 10 },
  // Skills
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillChip: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 8,
  },
  // Education
  eduRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  eduInst: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  eduYear: { fontSize: 8, color: C.muted },
  eduDegree: { fontSize: 8, color: C.muted },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.muted },
});

interface Props {
  resume: EnhancedResume;
}

export function EnhancedResumePdf({ resume }: Props) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name}>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <Text style={s.name}>{resume.name}</Text>
        {resume.title ? <Text style={s.title}>{resume.title}</Text> : null}
        <Text style={s.contact}>{resume.contact}</Text>
        <View style={s.rule} />

        {/* ── Summary ── */}
        {resume.summary ? (
          <View style={s.section}>
            <Text style={s.sectionHead}>Summary</Text>
            <View style={s.sectionRule} />
            <Text style={s.summary}>{resume.summary}</Text>
          </View>
        ) : null}

        {/* ── Experience ── */}
        {resume.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHead}>Experience</Text>
            <View style={s.sectionRule} />
            {resume.experience.map((job, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.jobRow}>
                  <Text style={s.jobTitle}>{job.role}</Text>
                  <Text style={s.jobPeriod}>{job.period}</Text>
                </View>
                <Text style={s.jobCompany}>
                  {job.company}
                  {job.location ? ` · ${job.location}` : ''}
                </Text>
                {job.bullets.map((b, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Skills ── */}
        {resume.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHead}>Skills</Text>
            <View style={s.sectionRule} />
            <View style={s.skillsWrap}>
              {resume.skills.map((sk, i) => (
                <View key={i} style={s.skillChip}>
                  <Text>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Education ── */}
        {resume.education.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHead}>Education</Text>
            <View style={s.sectionRule} />
            {resume.education.map((ed, i) => (
              <View key={i} style={{ marginBottom: 5 }}>
                <View style={s.eduRow}>
                  <Text style={s.eduInst}>{ed.institution}</Text>
                  <Text style={s.eduYear}>{ed.year}</Text>
                </View>
                <Text style={s.eduDegree}>{ed.degree}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Languages ── */}
        {resume.languages && resume.languages.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHead}>Languages</Text>
            <View style={s.sectionRule} />
            <Text style={{ color: C.muted }}>{resume.languages.join(' · ')}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{resume.name}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
