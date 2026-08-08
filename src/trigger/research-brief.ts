import { logger, task } from "@trigger.dev/sdk/v3";
import { Firecrawl, type SearchResultWeb } from "firecrawl";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { renderBriefHtml } from "../lib/renderBriefHtml.js";
import { appendReportRow } from "../lib/googleSheets.js";

type Recency = "evergreen" | "week" | "month" | "year";

export type ResearchBriefPayload = {
  topic: string;
  focus?: string;
  recency?: Recency;
};

export type ResearchBriefOutput = {
  reportId: string;
  topic: string;
  title: string;
  generatedDate: string;
  sourceCount: number;
  markdown: string;
  html: string;
  sheetsWriteOk: boolean;
};

type Source = {
  index: number;
  title: string;
  url: string;
  publisher: string;
  accessedDate: string;
  content: string;
};

const TBS_BY_RECENCY: Record<Recency, string | undefined> = {
  evergreen: undefined,
  week: "qdr:w",
  month: "qdr:m",
  year: "qdr:y",
};

const MAX_SOURCE_CHARS = 6000;
const MAX_SOURCES_TO_SCRAPE = 6;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const researchBriefTask = task({
  id: "research-brief",
  maxDuration: 900,
  // Default machine (small-1x, ~0.5GB) OOMs under the combined weight of the
  // Anthropic/Firecrawl/googleapis SDKs plus several scraped pages in memory.
  machine: "medium-1x",
  run: async (payload: ResearchBriefPayload, { ctx }): Promise<ResearchBriefOutput> => {
    const topic = payload.topic?.trim();
    if (!topic) throw new Error("topic is required");
    const focus = payload.focus?.trim() || "";
    const recency = payload.recency ?? "evergreen";

    const query = focus ? `${topic} ${focus}` : topic;
    const tbs = TBS_BY_RECENCY[recency];

    logger.log("Searching", { query, recency });
    const firecrawl = new Firecrawl({ apiKey: env.firecrawlApiKey });
    const searchResult = await firecrawl.search(query, {
      limit: 10,
      ...(tbs ? { tbs } : {}),
    });
    // No scrapeOptions passed, so results are always the lightweight
    // SearchResultWeb shape, not the full Document union member.
    const webResults = (searchResult.web ?? []) as SearchResultWeb[];
    if (webResults.length === 0) {
      throw new Error(`No search results found for "${query}"`);
    }

    const candidates = webResults.slice(0, MAX_SOURCES_TO_SCRAPE);
    logger.log(`Scraping ${candidates.length} sources`);

    const scraped = await Promise.allSettled(
      candidates.map((c) =>
        firecrawl.scrape(c.url, { formats: ["markdown"], onlyMainContent: true })
      )
    );

    const today = new Date().toISOString().slice(0, 10);
    const sources: Source[] = [];
    const failures: string[] = [];
    scraped.forEach((result, i) => {
      if (result.status !== "fulfilled") {
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push(`${candidates[i].url} -> ${reason}`);
        logger.warn(`Scrape failed for ${candidates[i].url}`, { error: reason });
        return;
      }
      if (!result.value.markdown) {
        failures.push(`${candidates[i].url} -> no markdown returned`);
        logger.warn(`Scrape returned no markdown for ${candidates[i].url}`);
        return;
      }
      const doc = result.value;
      const url = candidates[i].url;
      sources.push({
        index: sources.length + 1,
        title: doc.metadata?.title || candidates[i].title || url,
        url,
        publisher: publisherFromUrl(url),
        accessedDate: today,
        content: doc.markdown!.slice(0, MAX_SOURCE_CHARS),
      });
    });

    if (sources.length === 0) {
      throw new Error(
        `All source scrapes failed; nothing to synthesize from. Details: ${failures.join(" | ")}`
      );
    }
    logger.log(`Successfully scraped ${sources.length} sources`);

    const body = await synthesizeBrief({ topic, focus, recency, sources });

    const reportId = `${slugify(topic)}-${today}`;
    const title = `Research Brief: ${topic}`;
    const frontmatter = `---\ntopic: ${topic}\ngenerated: ${today}\nsources: ${sources.length}\n---\n\n`;
    const markdown = frontmatter + body;
    const html = await renderBriefHtml(title, markdown);

    let sheetsWriteOk = true;
    try {
      await appendReportRow({
        id: reportId,
        createdAt: new Date().toISOString(),
        topic,
        focus,
        recency,
        status: "completed",
        sourceCount: sources.length,
        runId: ctx.run.id,
        title,
        markdown,
      });
    } catch (err) {
      logger.error("Failed to write report to Google Sheets", {
        error: err instanceof Error ? err.message : String(err),
      });
      sheetsWriteOk = false;
    }

    return {
      reportId,
      topic,
      title,
      generatedDate: today,
      sourceCount: sources.length,
      markdown,
      html,
      sheetsWriteOk,
    };
  },
});

async function synthesizeBrief(input: {
  topic: string;
  focus: string;
  recency: string;
  sources: Source[];
}): Promise<string> {
  const client = getAnthropicClient();

  const systemPrompt = `You are writing a structured research brief from a fixed set of already-scraped sources. Produce a single markdown document with exactly these sections, in this order, using these exact H2 headings: "## Executive Summary", "## Key Findings", "## Analysis", "## Recommendations", "## Sources". Do not include YAML frontmatter — that is added separately. Start with "# Research Brief: <Topic Title>".

- Executive Summary: 3-5 sentences — the takeaway if the reader reads nothing else.
- Key Findings: H3 subsections, each citing the source(s) it draws from with an inline markdown link, e.g. ([Publisher](URL)).
- Analysis: synthesis across findings — patterns, tensions between sources, what's uncertain or contested.
- Recommendations: numbered, concrete, actionable.
- Sources: a markdown table with columns #, Title, Publisher, URL, Accessed, followed by one italic paragraph noting anything about source currency/quality/bias the reader should weigh.

Use only the sources provided below. If sources are thin (fewer than 4), or currency can't be confirmed for one, say so explicitly rather than overstating confidence.`;

  const sourcesText = input.sources
    .map(
      (s) =>
        `[${s.index}] Title: ${s.title} | Publisher: ${s.publisher} | URL: ${s.url} | Accessed: ${s.accessedDate}\n${s.content}`
    )
    .join("\n\n");

  const userMessage = `Topic: ${input.topic}
Focus: ${input.focus || "(none specified)"}
Recency filter: ${input.recency}
Number of sources found: ${input.sources.length}

Sources:
${sourcesText}

Write the research brief now.`;

  async function callOnce() {
    return client.messages.create({
      model: "claude-opus-5",
      max_tokens: 12000,
      system: systemPrompt,
      output_config: { effort: "medium" },
      messages: [{ role: "user", content: userMessage }],
    });
  }

  let response: Anthropic.Message | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await callOnce();
      break;
    } catch (err) {
      lastError = err;
      logger.warn("Anthropic call failed, retrying", {
        attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!response) {
    throw new Error(
      `Anthropic API call failed after retries: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Research brief generation was declined by safety systems");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Research brief generation was truncated (hit max_tokens)");
  }

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!textBlock) {
    throw new Error("No text content returned from Anthropic");
  }
  return textBlock.text;
}
