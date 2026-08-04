import type { Tool } from '../types'

export const FALLBACK_TOOLS: Tool[] = [
  { id: 'gpt-2', name: 'GPT-2', vendor: 'OpenAI', release_date: '2019-02-14', category: 'LLM', note: 'First widely-noted "too dangerous to release" language model.' },
  { id: 'gpt-3-api', name: 'GPT-3', vendor: 'OpenAI', release_date: '2020-06-11', category: 'LLM', note: '175B params, few-shot prompting goes mainstream.' },
  { id: 'github-copilot-preview', name: 'GitHub Copilot', vendor: 'GitHub/OpenAI', release_date: '2021-06-29', category: 'coding assistant', note: 'AI pair programmer, technical preview.' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', vendor: 'Stability AI', release_date: '2022-08-22', category: 'image gen', note: 'Open-weights text-to-image.' },
  { id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', release_date: '2022-11-30', category: 'LLM chat', note: 'Fastest-growing consumer app in history at launch.' },
  { id: 'gpt-4', name: 'GPT-4', vendor: 'OpenAI', release_date: '2023-03-14', category: 'LLM', note: 'Multimodal frontier model, bar-exam-passing.' },
  { id: 'claude-2', name: 'Claude 2', vendor: 'Anthropic', release_date: '2023-07-11', category: 'LLM', note: '100k context window.' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', vendor: 'OpenAI', release_date: '2023-11-06', category: 'LLM', note: '128k context, cheaper, more current knowledge.' },
  { id: 'gemini-1-0', name: 'Gemini 1.0', vendor: 'Google DeepMind', release_date: '2023-12-06', category: 'LLM', note: 'Natively multimodal from the ground up.' },
  { id: 'claude-3', name: 'Claude 3', vendor: 'Anthropic', release_date: '2024-03-04', category: 'LLM', note: 'Opus/Sonnet/Haiku family.' },
  { id: 'gpt-4o', name: 'GPT-4o', vendor: 'OpenAI', release_date: '2024-05-13', category: 'LLM', note: 'Real-time voice + vision, "omni" model.' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', vendor: 'Anthropic', release_date: '2024-06-20', category: 'LLM', note: 'Introduces computer use.' },
  { id: 'openai-o1', name: 'OpenAI o1', vendor: 'OpenAI', release_date: '2024-09-12', category: 'reasoning model', note: 'Chain-of-thought reasoning before answering.' },
  { id: 'cursor-yolo-mode', name: 'Cursor "YOLO mode"', vendor: 'Anysphere', release_date: '2024-11-01', category: 'coding agent', note: 'Agent runs terminal commands autonomously without per-step approval.', sources: ['https://www.cursor.com/changelog'] },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', vendor: 'Anthropic', release_date: '2025-02-24', category: 'LLM', note: 'First hybrid reasoning model in the Claude line.' },
  { id: 'openai-gpt-4-5', name: 'GPT-4.5', vendor: 'OpenAI', release_date: '2025-02-27', category: 'LLM', note: 'Largest OpenAI model to date at release.' },
  { id: 'claude-code', name: 'Claude Code', vendor: 'Anthropic', release_date: '2025-02-24', category: 'coding agent', note: 'Agentic CLI coding tool, terminal-native.' },
  { id: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro', vendor: 'Google DeepMind', release_date: '2025-03-25', category: 'LLM', note: 'Native reasoning + 1M token context.' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', vendor: 'Anthropic', release_date: '2025-05-22', category: 'LLM', note: 'Long-horizon agentic coding, hours-long autonomous runs.' },
  { id: 'gpt-5', name: 'GPT-5', vendor: 'OpenAI', release_date: '2025-08-07', category: 'LLM', note: 'Unified reasoning + fast-response routing.' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', vendor: 'Anthropic', release_date: '2025-09-29', category: 'LLM', note: 'Best coding model at release per internal benchmarks.' },
  { id: 'gemini-3', name: 'Gemini 3', vendor: 'Google DeepMind', release_date: '2025-11-18', category: 'LLM', note: 'Next-gen multimodal reasoning.' },
  // Oct 2025 -> Aug 2026. Ids and release_date are copied verbatim from
  // api/src/dataset.ts (the canonical id space); category/note stay in this
  // list's own human-readable style.
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', vendor: 'Anthropic', release_date: '2025-10-15', category: 'LLM', note: 'Small and fast at near-frontier coding quality.' },
  { id: 'claude-code-web', name: 'Claude Code on the web', vendor: 'Anthropic', release_date: '2025-10-20', category: 'coding agent', note: 'Agents leave the terminal and run in managed sandboxes.' },
  { id: 'cursor-2-0', name: 'Cursor 2.0 + Composer', vendor: 'Anysphere', release_date: '2025-10-29', category: 'coding agent', note: 'Agent-centred rewrite with Cursor\'s first in-house model.' },
  { id: 'gpt-5-1', name: 'GPT-5.1', vendor: 'OpenAI', release_date: '2025-11-12', category: 'LLM', note: 'Instant/Thinking refresh of the GPT-5 family.' },
  { id: 'google-antigravity', name: 'Google Antigravity', vendor: 'Google', release_date: '2025-11-18', category: 'coding agent', note: 'Agent-first IDE orchestrating parallel coding agents.' },
  { id: 'gpt-5-1-codex-max', name: 'GPT-5.1-Codex-Max', vendor: 'OpenAI', release_date: '2025-11-19', category: 'coding agent', note: 'Works across multiple context windows for day-long tasks.' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', vendor: 'Anthropic', release_date: '2025-11-24', category: 'LLM', note: 'Big coding and computer-use jump over Opus 4.1.' },
  { id: 'gemini-3-deep-think', name: 'Gemini 3 Deep Think', vendor: 'Google DeepMind', release_date: '2025-12-03', category: 'reasoning model', note: 'Extended-reasoning mode for the hardest problems.' },
  { id: 'gpt-5-2', name: 'GPT-5.2', vendor: 'OpenAI', release_date: '2025-12-11', category: 'reasoning model', note: 'Instant / Thinking / Pro tiers with extended thinking.' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', vendor: 'Google DeepMind', release_date: '2025-12-17', category: 'LLM', note: 'Latency-optimised Gemini 3 for high-volume work.' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', vendor: 'Anthropic', release_date: '2026-02-05', category: 'LLM', note: 'Introduces multi-agent "agent teams" workflows.' },
  { id: 'gpt-5-3-codex', name: 'GPT-5.3-Codex', vendor: 'OpenAI', release_date: '2026-02-05', category: 'coding agent', note: 'Repo search, terminal execution and debugging.' },
  { id: 'cursor-composer-1-5', name: 'Cursor Composer 1.5', vendor: 'Anysphere', release_date: '2026-02-10', category: 'coding agent', note: 'Faster, cheaper revision of Cursor\'s in-house model.' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', vendor: 'Anthropic', release_date: '2026-02-17', category: 'LLM', note: 'Mid-tier 4.6-generation model, shipped after Opus 4.6.' },
  { id: 'gemini-3-1-pro', name: 'Gemini 3.1 Pro', vendor: 'Google DeepMind', release_date: '2026-02-19', category: 'reasoning model', note: 'Long-context reasoning over large datasets.' },
  { id: 'gpt-5-4', name: 'GPT-5.4', vendor: 'OpenAI', release_date: '2026-03-05', category: 'reasoning model', note: 'Flagship 5.4; mini and nano tiers followed.' },
  { id: 'cursor-composer-2', name: 'Cursor Composer 2', vendor: 'Anysphere', release_date: '2026-03-19', category: 'coding agent', note: 'Second-generation Cursor frontier coding model.' },
  { id: 'cursor-3', name: 'Cursor 3', vendor: 'Anysphere', release_date: '2026-04-02', category: 'coding agent', note: 'Agent-first interface, parallel agents by default.' },
  { id: 'llama-5', name: 'Llama 5', vendor: 'Meta', release_date: '2026-04-08', category: 'open-weights LLM', note: 'Open-weight release alongside Meta\'s closed Muse line.' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', vendor: 'Anthropic', release_date: '2026-04-16', category: 'LLM', note: 'Opus 4.7, widely discussed for stricter refusals.' },
  { id: 'gpt-5-5', name: 'GPT-5.5', vendor: 'OpenAI', release_date: '2026-04-23', category: 'reasoning model', note: 'GPT-5.5 flagship, codename "Spud".' },
  { id: 'deepseek-v4', name: 'DeepSeek V4 (Pro & Flash)', vendor: 'DeepSeek', release_date: '2026-04-24', category: 'open-weights LLM', note: 'MIT-licensed frontier MoE pair.' },
  { id: 'gemini-3-5-flash', name: 'Gemini 3.5 Flash', vendor: 'Google DeepMind', release_date: '2026-05-19', category: 'LLM', note: 'Launched at Google I/O 2026.' },
  { id: 'google-antigravity-2-0', name: 'Google Antigravity 2.0', vendor: 'Google', release_date: '2026-05-19', category: 'coding agent', note: 'Dynamic subagents, scheduled background tasks, Go CLI.' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', vendor: 'Anthropic', release_date: '2026-05-28', category: 'LLM', note: 'Last Claude 4-generation Opus before the 5 family.' },
  { id: 'claude-fable-5', name: 'Claude Fable 5', vendor: 'Anthropic', release_date: '2026-06-09', category: 'LLM', note: 'First Claude 5 model, built for long-horizon agentic work.' },
  { id: 'claude-mythos-5', name: 'Claude Mythos 5', vendor: 'Anthropic', release_date: '2026-06-09', category: 'LLM', note: 'Limited-access Claude 5 sibling aimed at security work.' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', vendor: 'Anthropic', release_date: '2026-06-30', category: 'LLM', note: 'Roughly Opus 4.8 quality at a fraction of the cost.' },
  { id: 'gpt-5-6', name: 'GPT-5.6 (Luna / Terra / Sol)', vendor: 'OpenAI', release_date: '2026-07-09', category: 'reasoning model', note: 'Three-tier family after a late-June limited preview.' },
  { id: 'gemini-3-6-flash', name: 'Gemini 3.6 Flash', vendor: 'Google DeepMind', release_date: '2026-07-21', category: 'LLM', note: 'Shipped alongside Gemini 3.5 Flash-Lite.' },
  { id: 'claude-opus-5', name: 'Claude Opus 5', vendor: 'Anthropic', release_date: '2026-07-24', category: 'LLM', note: 'Flagship Claude 5 for complex agentic coding.' },
]

export const DEFAULT_TOOL_ID = 'cursor-yolo-mode'

// Old ids this fallback list shipped under before it was reconciled to the api
// dataset's canonical id space (api/src/dataset.ts). Existing shared links using
// these ids must keep resolving — see resolveToolId, applied at permalink parse.
export const TOOL_ID_ALIASES: Record<string, string> = {
  'gpt-3': 'gpt-3-api',
  'github-copilot': 'github-copilot-preview',
  'claude-3.5-sonnet': 'claude-3-5-sonnet',
  'o1': 'openai-o1',
  'cursor-yolo': 'cursor-yolo-mode',
  'claude-3.7-sonnet': 'claude-3-7-sonnet',
  'gpt-4.5': 'openai-gpt-4-5',
  'gemini-1': 'gemini-1-0',
  'gemini-2.5-pro': 'gemini-2-5-pro',
  'claude-4-opus': 'claude-opus-4',
  'claude-4.5-sonnet': 'claude-sonnet-4-5',
}

export function resolveToolId(id: string): string {
  return Object.hasOwn(TOOL_ID_ALIASES, id) ? TOOL_ID_ALIASES[id] : id
}
