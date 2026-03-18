import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">AI Job Analyzer</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Upload your resume and paste a job posting to get an AI-powered match score, skill gap
        analysis, and a tailored cover letter.
      </p>
      <Link
        to="/analyze"
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Start analyzing
      </Link>
    </div>
  );
}
