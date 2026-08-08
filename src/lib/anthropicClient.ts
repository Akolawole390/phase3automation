import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

export function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: env.anthropicApiKey });
}
