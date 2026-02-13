import { describe, test, expect, vi, beforeEach } from "vitest";

describe("getLanguageModel", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("returns mock model when no API key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { getLanguageModel, MockLanguageModel } = await import(
      "@/lib/provider"
    );
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
    expect(model.provider).toBe("mock");
  });

  test("returns mock model when API key is empty string", async () => {
    process.env.ANTHROPIC_API_KEY = "";
    const { getLanguageModel, MockLanguageModel } = await import(
      "@/lib/provider"
    );
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
  });

  test("returns mock model when API key is whitespace", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const { getLanguageModel, MockLanguageModel } = await import(
      "@/lib/provider"
    );
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
  });
});

describe("MockLanguageModel", () => {
  test("implements LanguageModelV1 interface", async () => {
    const { MockLanguageModel } = await import("@/lib/provider");
    const model = new MockLanguageModel("test-model");

    expect(model.specificationVersion).toBe("v1");
    expect(model.provider).toBe("mock");
    expect(model.modelId).toBe("test-model");
    expect(model.defaultObjectGenerationMode).toBe("tool");
  });

  test("doGenerate returns text and tool calls", async () => {
    const { MockLanguageModel } = await import("@/lib/provider");
    const model = new MockLanguageModel("test-model");

    const result = await model.doGenerate({
      prompt: [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "build a counter" }],
        },
      ],
      inputFormat: "messages",
      mode: { type: "regular" as const },
    } as any);

    expect(result.text).toBeDefined();
    expect(result.finishReason).toBeDefined();
    expect(result.usage.promptTokens).toBeGreaterThan(0);
    expect(result.usage.completionTokens).toBeGreaterThan(0);
  });

  test("doStream returns a readable stream", async () => {
    const { MockLanguageModel } = await import("@/lib/provider");
    const model = new MockLanguageModel("test-model");

    const result = await model.doStream({
      prompt: [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "build a form" }],
        },
      ],
      inputFormat: "messages",
      mode: { type: "regular" as const },
    } as any);

    expect(result.stream).toBeInstanceOf(ReadableStream);

    // Read some chunks from the stream
    const reader = result.stream.getReader();
    const chunks: any[] = [];
    let done = false;
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (value) chunks.push(value);
      done = streamDone;
    }

    expect(chunks.length).toBeGreaterThan(0);
    // Should include text deltas, a tool call, and a finish part
    const types = chunks.map((c) => c.type);
    expect(types).toContain("text-delta");
    expect(types).toContain("tool-call");
    expect(types).toContain("finish");
  });
});
