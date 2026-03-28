import chalk from 'chalk';

function renderBar(value: number, width: number): string {
  const filled = Math.round((value / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function renderScore(score: number): string {
  const bar = renderBar(score, 30);
  const color = score >= 75 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
  return `${color.bold(`${score}%`)} ${color(bar)}`;
}

export function renderCategoryScores(scores: Record<string, number>): void {
  const labels: Record<string, string> = {
    technicalSkills: 'Technical Skills',
    experience: 'Experience',
    cultureFit: 'Culture Fit',
    keywords: 'Keywords',
    seniority: 'Seniority',
    tools: 'Tools',
  };

  const maxLabel = Math.max(...Object.keys(labels).map(k => labels[k].length));

  for (const [key, label] of Object.entries(labels)) {
    const val = scores[key] ?? 0;
    const padded = label.padEnd(maxLabel);
    const bar = renderBar(val, 20);
    const color = val >= 75 ? chalk.green : val >= 50 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.dim(padded)}  ${color(bar)} ${color.bold(`${val}%`)}`);
  }
}

export function renderList(items: string[], color: (s: string) => string = chalk.white): void {
  for (const item of items) {
    console.log(`  ${chalk.dim('•')} ${color(item)}`);
  }
}

export function renderSection(title: string): void {
  console.log();
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

export function renderError(msg: string): void {
  console.error(chalk.red.bold('✖ Error: ') + chalk.red(msg));
}

export function renderSuccess(msg: string): void {
  console.log(chalk.green.bold('✔ ') + chalk.green(msg));
}
