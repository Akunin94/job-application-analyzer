import * as cheerio from 'cheerio';

export interface ParsedJobPosting {
  title: string;
  company: string;
  jobPosting: string;
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  // Preserve line breaks from block elements
  $('br').replaceWith('\n');
  $('p, li, div, h1, h2, h3, h4').each((_, el) => {
    const $el = $(el);
    $el.prepend('\n');
    $el.append('\n');
  });
  return $.text()
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tryJsonLd(html: string): ParsedJobPosting | null {
  const $ = cheerio.load(html);
  let result: ParsedJobPosting | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return;
    try {
      const data = JSON.parse($(el).html() ?? '');
      if (data['@type'] !== 'JobPosting') return;

      const title: string = data.title ?? '';
      const company: string = data.hiringOrganization?.name ?? '';
      const rawDesc: string = data.description ?? '';
      if (!rawDesc) return;

      const description = rawDesc.includes('<') ? stripHtml(rawDesc) : rawDesc;

      const header = [title, company].filter(Boolean).join('\n');
      result = {
        title,
        company,
        jobPosting: header ? `${header}\n\n${description}` : description,
      };
    } catch {
      // skip malformed JSON-LD
    }
  });

  return result;
}

function tryHtmlFallback(html: string): ParsedJobPosting | null {
  const $ = cheerio.load(html);

  const title =
    $('h1.top-card-layout__title, h1.topcard__title, .job-details-jobs-unified-top-card__job-title')
      .first()
      .text()
      .trim() || $('h1').first().text().trim();

  const company = $(
    '.topcard__org-name-link, .top-card-layout__card .topcard__flavor--black-link, .job-details-jobs-unified-top-card__company-name',
  )
    .first()
    .text()
    .trim();

  const descEl = $(
    '.description__text--rich, .show-more-less-html__markup, #job-details, .jobs-description__content',
  ).first();

  if (!descEl.length) return null;

  const description = stripHtml(descEl.html() ?? descEl.text());
  if (!description) return null;

  const header = [title, company].filter(Boolean).join('\n');
  return {
    title,
    company,
    jobPosting: header ? `${header}\n\n${description}` : description,
  };
}

export async function parseLinkedInJobUrl(url: string): Promise<ParsedJobPosting> {
  // Normalize: remove query params / fragments that can cause redirects
  const cleanUrl = url.split('?')[0].split('#')[0];

  const response = await fetch(cleanUrl, { headers: FETCH_HEADERS });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('LinkedIn rate-limited this request. Please try again in a moment.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('LinkedIn requires a login to view this job posting.');
    }
    throw new Error(`Failed to fetch job page (HTTP ${response.status}).`);
  }

  const html = await response.text();

  // Check for login wall
  if (
    html.includes('authwall') ||
    html.includes('linkedin.com/login') ||
    html.includes('Sign in to view')
  ) {
    throw new Error(
      'LinkedIn requires a login to view this job posting. Try copying the job description manually.',
    );
  }

  const result = tryJsonLd(html) ?? tryHtmlFallback(html);

  if (!result) {
    throw new Error(
      'Could not extract job description from this page. The posting may require a login or the URL format is unsupported.',
    );
  }

  return result;
}
