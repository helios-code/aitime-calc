import type { Tool } from '../types'

export const FALLBACK_TOOLS: Tool[] = [
  { id: 'gpt-2', name: 'GPT-2', vendor: 'OpenAI', release_date: '2019-02-14', category: 'LLM', note: 'First widely-noted "too dangerous to release" language model.' },
  { id: 'gpt-3', name: 'GPT-3', vendor: 'OpenAI', release_date: '2020-06-11', category: 'LLM', note: '175B params, few-shot prompting goes mainstream.' },
  { id: 'github-copilot', name: 'GitHub Copilot', vendor: 'GitHub/OpenAI', release_date: '2021-06-29', category: 'coding assistant', note: 'AI pair programmer, technical preview.' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', vendor: 'Stability AI', release_date: '2022-08-22', category: 'image gen', note: 'Open-weights text-to-image.' },
  { id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', release_date: '2022-11-30', category: 'LLM chat', note: 'Fastest-growing consumer app in history at launch.' },
  { id: 'gpt-4', name: 'GPT-4', vendor: 'OpenAI', release_date: '2023-03-14', category: 'LLM', note: 'Multimodal frontier model, bar-exam-passing.' },
  { id: 'claude-2', name: 'Claude 2', vendor: 'Anthropic', release_date: '2023-07-11', category: 'LLM', note: '100k context window.' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', vendor: 'OpenAI', release_date: '2023-11-06', category: 'LLM', note: '128k context, cheaper, more current knowledge.' },
  { id: 'gemini-1', name: 'Gemini 1.0', vendor: 'Google DeepMind', release_date: '2023-12-06', category: 'LLM', note: 'Natively multimodal from the ground up.' },
  { id: 'claude-3', name: 'Claude 3', vendor: 'Anthropic', release_date: '2024-03-04', category: 'LLM', note: 'Opus/Sonnet/Haiku family.' },
  { id: 'gpt-4o', name: 'GPT-4o', vendor: 'OpenAI', release_date: '2024-05-13', category: 'LLM', note: 'Real-time voice + vision, "omni" model.' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', vendor: 'Anthropic', release_date: '2024-06-20', category: 'LLM', note: 'Introduces computer use.' },
  { id: 'o1', name: 'OpenAI o1', vendor: 'OpenAI', release_date: '2024-09-12', category: 'reasoning model', note: 'Chain-of-thought reasoning before answering.' },
  { id: 'cursor-yolo', name: 'Cursor "YOLO mode"', vendor: 'Anysphere', release_date: '2024-11-01', category: 'coding agent', note: 'Agent runs terminal commands autonomously without per-step approval.', sources: ['https://www.cursor.com/changelog'] },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', vendor: 'Anthropic', release_date: '2025-02-24', category: 'LLM', note: 'First hybrid reasoning model in the Claude line.' },
  { id: 'gpt-4.5', name: 'GPT-4.5', vendor: 'OpenAI', release_date: '2025-02-27', category: 'LLM', note: 'Largest OpenAI model to date at release.' },
  { id: 'claude-code', name: 'Claude Code', vendor: 'Anthropic', release_date: '2025-02-24', category: 'coding agent', note: 'Agentic CLI coding tool, terminal-native.' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', vendor: 'Google DeepMind', release_date: '2025-03-25', category: 'LLM', note: 'Native reasoning + 1M token context.' },
  { id: 'claude-4-opus', name: 'Claude Opus 4', vendor: 'Anthropic', release_date: '2025-05-22', category: 'LLM', note: 'Long-horizon agentic coding, hours-long autonomous runs.' },
  { id: 'gpt-5', name: 'GPT-5', vendor: 'OpenAI', release_date: '2025-08-07', category: 'LLM', note: 'Unified reasoning + fast-response routing.' },
  { id: 'claude-4.5-sonnet', name: 'Claude Sonnet 4.5', vendor: 'Anthropic', release_date: '2025-09-29', category: 'LLM', note: 'Best coding model at release per internal benchmarks.' },
  { id: 'gemini-3', name: 'Gemini 3', vendor: 'Google DeepMind', release_date: '2025-11-18', category: 'LLM', note: 'Next-gen multimodal reasoning.' },
]

export const DEFAULT_TOOL_ID = 'cursor-yolo'
