#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeCommand } from './commands/analyze.js';
import { enhanceCommand } from './commands/enhance.js';

const DEFAULT_API_URL = process.env.JAB_API_URL ?? 'http://localhost:3001';

const program = new Command();

program
  .name('jab')
  .description(
    chalk.cyan('AI Job Application Analyzer') + chalk.dim(' — analyze and enhance your resume'),
  )
  .version('0.1.0');

program
  .command('analyze <resume> <job>')
  .description('Analyze a resume PDF against a job posting')
  .option('--api-url <url>', 'Backend API URL', DEFAULT_API_URL)
  .option('-c, --company <name>', 'Company name for the report')
  .option('-l, --language <lang>', 'Response language (auto, en, ru, de, fr…)', 'auto')
  .option('-o, --output <format>', 'Output format: text or json', 'text')
  .addHelpText(
    'after',
    `
Examples:
  $ jab analyze resume.pdf job.txt
  $ jab analyze resume.pdf job.txt --company "GitLab" --language en
  $ jab analyze resume.pdf "Senior Fullstack Engineer at GitLab..." --output json
`,
  )
  .action(
    async (
      resume: string,
      job: string,
      opts: { apiUrl: string; company?: string; language?: string; output?: string },
    ) => {
      await analyzeCommand(resume, job, {
        apiUrl: opts.apiUrl,
        company: opts.company,
        language: opts.language,
        output: opts.output as 'json' | 'text' | undefined,
      });
    },
  );

program
  .command('enhance <resume> <job>')
  .description('Interactively select improvements and generate an enhanced resume')
  .option('--api-url <url>', 'Backend API URL', DEFAULT_API_URL)
  .option('-c, --company <name>', 'Company name')
  .option('--out <path>', 'Output JSON file path (default: <name>-enhanced.json)')
  .addHelpText(
    'after',
    `
Examples:
  $ jab enhance resume.pdf job.txt
  $ jab enhance resume.pdf job.txt --company "GitLab" --out enhanced.json
`,
  )
  .action(
    async (
      resume: string,
      job: string,
      opts: { apiUrl: string; company?: string; out?: string },
    ) => {
      await enhanceCommand(resume, job, {
        apiUrl: opts.apiUrl,
        company: opts.company,
        out: opts.out,
      });
    },
  );

program.parse();
