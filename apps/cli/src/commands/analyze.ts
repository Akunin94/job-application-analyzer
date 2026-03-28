import { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import {
  uploadResume,
  streamAnalysis,
  type AnalysisResult,
  type SSEEvent,
} from '../api/stream-analysis.js';
import {
  renderScore,
  renderCategoryScores,
  renderList,
  renderSection,
  renderError,
} from '../output/renderer.js';

interface AnalyzeOptions {
  apiUrl: string;
  company?: string;
  language?: string;
  output?: 'json' | 'text';
}

function renderAnalysis(result: AnalysisResult, company: string): void {
  console.log();
  console.log(
    chalk.bold(`  Job Match Analysis`) +
      (company !== 'Unknown Company' ? chalk.dim(` — ${company}`) : ''),
  );
  console.log(chalk.dim('  ' + '═'.repeat(52)));

  // Score
  console.log();
  console.log(`  ${chalk.bold('Match Score')}   ${renderScore(result.matchScore)}`);
  console.log(
    `  ${chalk.bold('Confidence')}   ${
      result.confidence === 'high'
        ? chalk.green(result.confidence)
        : result.confidence === 'medium'
          ? chalk.yellow(result.confidence)
          : chalk.red(result.confidence)
    }`,
  );

  // Summary
  renderSection('Summary');
  console.log(`  ${chalk.white(result.summary)}`);

  // Category scores
  renderSection('Category Breakdown');
  renderCategoryScores(result.categoryScores as unknown as Record<string, number>);

  // Strengths
  if (result.strengths.length > 0) {
    renderSection('Strengths');
    renderList(result.strengths, chalk.green);
  }

  // Skill gaps
  if (result.skillGaps.length > 0) {
    renderSection('Skill Gaps');
    for (const gap of result.skillGaps) {
      const color =
        gap.priority === 'critical'
          ? chalk.red
          : gap.priority === 'important'
            ? chalk.yellow
            : chalk.dim;
      const badge = gap.priority === 'critical' ? '●' : gap.priority === 'important' ? '◐' : '○';
      console.log(`  ${color(badge)} ${chalk.bold(gap.skill)} ${chalk.dim(`— ${gap.context}`)}`);
    }
  }

  // Red flags
  if (result.redFlags.length > 0) {
    renderSection('Red Flags');
    renderList(result.redFlags, chalk.red);
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    renderSection('Recommendations');
    renderList(result.recommendations, chalk.cyan);
  }

  // Keywords
  renderSection('Keywords');
  if (result.keywords.matched.length > 0) {
    console.log(
      `  ${chalk.dim('Matched:')} ${result.keywords.matched.map(k => chalk.green(k)).join(chalk.dim(', '))}`,
    );
  }
  if (result.keywords.missing.length > 0) {
    console.log(
      `  ${chalk.dim('Missing:')} ${result.keywords.missing.map(k => chalk.red(k)).join(chalk.dim(', '))}`,
    );
  }

  console.log();
}

export async function analyzeCommand(
  resumePath: string,
  jobInput: string,
  options: AnalyzeOptions,
): Promise<void> {
  const { apiUrl, company = 'Unknown Company', language = 'auto', output = 'text' } = options;

  // Validate resume file
  if (!existsSync(resumePath)) {
    renderError(`Resume file not found: ${resumePath}`);
    process.exit(1);
  }

  // Read job posting (file or inline text)
  let jobPosting: string;
  if (existsSync(jobInput)) {
    jobPosting = readFileSync(jobInput, 'utf-8');
  } else {
    jobPosting = jobInput;
  }

  if (jobPosting.trim().length < 50) {
    renderError('Job posting is too short. Provide a file path or paste the job description.');
    process.exit(1);
  }

  // Upload resume PDF
  const uploadSpinner = ora('Uploading resume…').start();
  let resumeText: string;
  try {
    resumeText = await uploadResume(apiUrl, resumePath);
    uploadSpinner.succeed(chalk.dim(`Resume extracted (${resumeText.length} chars)`));
  } catch (err) {
    uploadSpinner.fail('Failed to upload resume');
    renderError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Stream analysis
  const analyzeSpinner = ora('Analyzing job match…').start();
  let result: AnalysisResult | null = null;

  try {
    for await (const event of streamAnalysis(apiUrl, resumeText, jobPosting, company, language)) {
      const e = event as SSEEvent;
      if (e.type === 'match_score') {
        analyzeSpinner.text = `Analyzing… match score: ${chalk.bold(String(e.data.score) + '%')}`;
      } else if (e.type === 'done') {
        result = e.data as AnalysisResult;
      } else if (e.type === 'error') {
        throw new Error(e.data.message);
      }
    }
    analyzeSpinner.succeed('Analysis complete');
  } catch (err) {
    analyzeSpinner.fail('Analysis failed');
    renderError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (!result) {
    renderError('No result received from server');
    process.exit(1);
  }

  if (output === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  renderAnalysis(result, company);
}
