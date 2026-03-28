# jab — AI Job Application CLI

Command-line interface for the AI Job Application Analyzer.

## Commands

```
jab analyze <resume.pdf> <job>   Analyze a resume against a job posting
jab enhance <resume.pdf> <job>   Interactively enhance your resume
```

## Usage

```bash
# Analyze a resume PDF against a job description file
jab analyze resume.pdf job.txt --company "GitLab"

# Or pass the job description inline
jab analyze resume.pdf "We are looking for a Senior Fullstack Engineer..." --company "GitLab"

# Output raw JSON
jab analyze resume.pdf job.txt --output json > result.json

# Interactive enhancement: select improvements and save enhanced resume JSON
jab enhance resume.pdf job.txt --company "GitLab" --out enhanced.json
```

## Setup

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Link globally (optional)
npm link
```

## Environment

Set `JAB_API_URL` to override the backend URL (default: `http://localhost:3001`):

```bash
export JAB_API_URL=https://your-api.example.com
jab analyze resume.pdf job.txt
```

## Development

```bash
# Run without building
pnpm dev -- analyze resume.pdf job.txt
```
