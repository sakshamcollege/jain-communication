type OllamaGenerateResponse = {
  response?: string;
  done?: boolean;
  error?: string;
};

export async function askOllama(prompt: string): Promise<string> {
  if (process.env.AI_MODE !== "local") {
    return "AI is available only on local network";
  }

  const baseUrl = process.env.OLLAMA_URL;
  if (!baseUrl) {
    throw new Error("OLLAMA_URL is not set");
  }

  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new Error("Prompt is required");
  }

  const url = new URL("/api/generate", baseUrl).toString();

  const controller = new AbortController();
  const timeoutMs = 15_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "phi3:mini",
        prompt: trimmedPrompt,
        stream: false,
        options: {
          num_predict: 60,
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(
        `Ollama request failed (${response.status})${details ? `: ${details}` : ""}`
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const text = typeof data?.response === "string" ? data.response : "";

    if (!text) {
      throw new Error("Ollama returned an empty response");
    }

    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}
