import { existsSync, readFileSync, writeFileSync } from 'fs';
import checkbox from '@inquirer/checkbox';
import chalk from 'chalk';
import ora from 'ora';
import {
  uploadResume,
  streamAnalysis,
  enhanceResume,
  type AnalysisResult,
  type EnhancedResume,
  type SSEEvent,
} from '../api/stream-analysis.js';
import { renderError, renderSection, renderSuccess } from '../output/renderer.js';

interface EnhanceOptions {
  apiUrl: string;
  company?: string;
  out?: string;
}

interface ImprovementItem {
  label: string;
  badge: string;
  priority: string;
}

function buildImprovements(result: AnalysisResult): ImprovementItem[] {
  const items: ImprovementItem[] = [];

  if (result.resumeSuggestions) {
    for (const s of result.resumeSuggestions) {
      const typeLabel =
        s.type === 'add'
          ? 'Add'
          : s.type === 'rewrite'
            ? 'Rewrite'
            : s.type === 'strengthen'
              ? 'Strengthen'
              : 'Remove';
      items.push({
        label: `[${s.section}] ${typeLabel}: ${s.suggestion.slice(0, 80)}${s.suggestion.length > 80 ? '…' : ''}`,
        badge: s.type,
        priority: 'normal',
      });
    }
  }

  for (const gap of result.skillGaps.filter(g => g.priority !== 'nice-to-have')) {
    items.push({
      label: `Add "${gap.skill}" to skills/experience`,
      badge: gap.priority,
      priority: gap.priority,
    });
  }

  return items;
}

export async function enhanceCommand(
  resumePath: string,
  jobInput: string,
  options: EnhanceOptions,
): Promise<void> {
  const { apiUrl, company = 'Unknown Company', out } = options;

  if (!existsSync(resumePath)) {
    renderError(`Resume file not found: ${resumePath}`);
    process.exit(1);
  }

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

  // Upload resume
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

  // Analyze to get improvement suggestions
  const analyzeSpinner = ora('Analyzing resume against job posting…').start();
  let result: AnalysisResult | null = null;

  try {
    for await (const event of streamAnalysis(apiUrl, resumeText, jobPosting, company, 'auto')) {
      const e = event as SSEEvent;
      if (e.type === 'done') {
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
    renderError('No analysis result received');
    process.exit(1);
  }

  // Build improvement list
  const improvements = buildImprovements(result);

  if (improvements.length === 0) {
    console.log(chalk.yellow('\n  No improvements found for this job posting.'));
    process.exit(0);
  }

  // Interactive selection
  renderSection('Select improvements to apply');
  console.log(chalk.dim('  Use space to select, enter to confirm\n'));

  const selected = await checkbox({
    message: 'Which improvements should be applied?',
    choices: improvements.map(imp => ({
      name: `[${imp.badge}] ${imp.label}`,
      value: imp.label,
      checked: imp.priority === 'critical',
    })),
    pageSize: 15,
  });

  if (selected.length === 0) {
    console.log(chalk.yellow('\n  No improvements selected. Exiting.'));
    process.exit(0);
  }

  // Generate enhanced resume
  const genSpinner = ora(
    `Generating enhanced resume with ${selected.length} improvements…`,
  ).start();
  let enhanced: EnhancedResume;

  try {
    enhanced = await enhanceResume(apiUrl, resumeText, jobPosting, selected);
    genSpinner.succeed('Enhanced resume generated');
  } catch (err) {
    genSpinner.fail('Generation failed');
    renderError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Output
  const outputPath = out ?? `${enhanced.name.replace(/\s+/g, '-').toLowerCase()}-enhanced.json`;
  const json = JSON.stringify(enhanced, null, 2);
  writeFileSync(outputPath, json, 'utf-8');

  console.log();
  renderSuccess(`Enhanced resume saved to ${chalk.bold(outputPath)}`);
  console.log();

  renderSection('Preview');
  console.log(
    `  ${chalk.bold(enhanced.name)}${enhanced.title ? chalk.dim(` — ${enhanced.title}`) : ''}`,
  );
  console.log(`  ${chalk.dim(enhanced.contact)}`);
  if (enhanced.summary) {
    console.log();
    console.log(
      `  ${chalk.white(enhanced.summary.slice(0, 200))}${enhanced.summary.length > 200 ? '…' : ''}`,
    );
  }
  console.log();
  console.log(`  ${chalk.dim('Experience:')} ${enhanced.experience.length} positions`);
  for (const job of enhanced.experience.slice(0, 3)) {
    console.log(
      `    ${chalk.green('•')} ${chalk.bold(job.role)} @ ${job.company} ${chalk.dim(job.period)}`,
    );
  }
  if (enhanced.experience.length > 3) {
    console.log(`    ${chalk.dim(`+${enhanced.experience.length - 3} more…`)}`);
  }
  console.log();
  console.log(
    `  ${chalk.dim('Skills:')} ${enhanced.skills.slice(0, 8).join(', ')}${enhanced.skills.length > 8 ? chalk.dim(' …') : ''}`,
  );
  console.log();
  console.log(chalk.dim(`  Use the web app to convert this JSON to a formatted PDF.`));
  console.log();
}
