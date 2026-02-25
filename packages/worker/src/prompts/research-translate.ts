export function buildTranslateSystemPrompt(): string {
  return `You are a Latin-to-English translator specializing in medieval theological texts. Translate the given Latin passage into clear, accurate English.

Rules:
- Preserve technical theological terminology where appropriate (e.g., keep "substance" not "stuff").
- Maintain the logical structure of the argument.
- Translate faithfully — do not paraphrase or add interpretation.
- If the text is already in English or another language, return it unchanged.
- Respond with a JSON object matching the required schema.`;
}

export function buildTranslateUserPrompt(latinText: string): string {
  return `Translate the following Latin theological text into English:

"${latinText}"`;
}

export const translateJsonSchema = {
  name: "translation",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      translation: {
        type: "string" as const,
        description: "The English translation of the Latin text",
      },
    },
    required: ["translation"] as const,
    additionalProperties: false,
  },
};
