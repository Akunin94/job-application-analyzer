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
      'event: summary\ndata: "Strong match on the stack; Kubernetes is the one real gap."\n\n',
      'event: category_scores\ndata: {"technicalSkills":80,"experience":70,"cultureFit":90,"keywords":85,"seniority":75,"tools":80}\n\n',
      'event: strengths\ndata: ["React","TypeScript","Node.js"]\n\n',
      'event: gaps\ndata: [{"skill":"Kubernetes","priority":"important","context":"Used in CI/CD"}]\n\n',
      'event: recommendations\ndata: ["Learn Kubernetes","Get AWS cert"]\n\n',
      'event: keywords\ndata: {"matched":["React","TypeScript"],"missing":["Kubernetes","Docker"]}\n\n',
      'event: red_flags\ndata: [{"flag":"US-only remote","quote":"Must be based in the United States","severity":"critical"}]\n\n',
      'event: ats_score\ndata: {"score":72,"verdict":"likely_pass","missingKeywords":["CI/CD","Docker"],"formattingTips":["Add a Skills section","Use standard section headers"]}\n\n',
      'event: done\ndata: null\n\n',
    );
    return new HttpResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),

  http.post(`${BASE}/api/analyze/follow-up`, () => {
    const body = sseStream(
      'event: follow_up\ndata: "Subject: Thank you — Senior Developer Interview"\n\n',
      'event: follow_up\ndata: "\\n\\nDear Sarah,\\n\\nThank you for taking the time to speak with me yesterday."\n\n',
      'event: done\ndata: null\n\n',
    );
    return new HttpResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),

  http.post(`${BASE}/api/analyze/generate`, () => {
    const body = sseStream(
      'event: section_start\ndata: {"target":"coverLetter"}\n\n',
      'event: delta\ndata: {"target":"coverLetter","text":"Dear Hiring Manager,"}\n\n',
      'event: section\ndata: {"target":"coverLetter","data":"Dear Hiring Manager,"}\n\n',
      'event: done\ndata: null\n\n',
    );
    return new HttpResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
];
