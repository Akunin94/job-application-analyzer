import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3001';

const encoder = new TextEncoder();

function sseStream(...chunks: string[]) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

export const handlers = [
  http.post(`${BASE}/api/upload/resume`, () =>
    HttpResponse.json({ text: 'Sample resume text content', fileName: 'resume.pdf' }),
  ),

  http.post(`${BASE}/api/analyze`, () => {
    const body = sseStream(
      'event: match_score\ndata: {"score":85,"confidence":"high"}\n\n',
      'event: category_scores\ndata: {"technicalSkills":80,"experience":70,"cultureFit":90,"keywords":85,"seniority":75,"tools":80}\n\n',
      'event: strengths\ndata: ["React","TypeScript","Node.js"]\n\n',
      'event: gaps\ndata: [{"skill":"Kubernetes","priority":"important","context":"Used in CI/CD"}]\n\n',
      'event: recommendations\ndata: ["Learn Kubernetes","Get AWS cert"]\n\n',
      'event: red_flags\ndata: [{"flag":"US-only remote","quote":"Must be based in the United States","severity":"critical"}]\n\n',
      'event: salary\ndata: {"min":90000,"max":130000,"currency":"USD","period":"year","confidence":"medium","notes":"Inferred from senior React/Node.js role in US market"}\n\n',
      'event: ats_score\ndata: {"score":72,"verdict":"likely_pass","missingKeywords":["CI/CD","Docker"],"formattingTips":["Add a Skills section","Use standard section headers"]}\n\n',
      'event: done\ndata: null\n\n',
    );
    return new HttpResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),

  http.post(`${BASE}/api/analyze/cover-letter`, () => {
    const body = sseStream(
      'event: cover_letter\ndata: "Dear Hiring Manager,"\n\n',
      'event: done\ndata: null\n\n',
    );
    return new HttpResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
];
