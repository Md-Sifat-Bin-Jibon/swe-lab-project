/**
 * Minimal OpenAI Chat Completions client (no SDK) with Structured Outputs.
 * Server-only: reads OPENAI_API_KEY from the environment.
 */

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export class OpenAIError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function openAIJson<T>(options: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new OpenAIError("OPENAI_API_KEY is not set.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);

  try {
    const response = await fetch(
      `${process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") || "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
          messages: [
            { role: "system", content: options.system },
            { role: "user", content: options.user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: options.schemaName, strict: true, schema: options.schema },
          },
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      choices?: { message?: { content?: string | null; refusal?: string | null } }[];
    } | null;

    if (!response.ok) {
      throw new OpenAIError(payload?.error?.message || `OpenAI request failed (${response.status}).`, response.status);
    }

    const message = payload?.choices?.[0]?.message;
    if (message?.refusal) throw new OpenAIError(`Model refused: ${message.refusal}`);
    if (!message?.content) throw new OpenAIError("OpenAI returned an empty response.");

    return JSON.parse(message.content) as T;
  } catch (error) {
    if (error instanceof OpenAIError) throw error;
    if ((error as Error)?.name === "AbortError") throw new OpenAIError("OpenAI request timed out.");
    throw new OpenAIError((error as Error)?.message || "OpenAI request failed.");
  } finally {
    clearTimeout(timer);
  }
}
