import type { ZodType } from "zod";
import { logger } from "@/lib/logger";

type GenerateObjectFn<T> = (input: {
  schema: ZodType<T>;
  prompt: string;
}) => Promise<{ object: T }>;

export async function generateObjectWithRetry<T>(
  generateObject: GenerateObjectFn<T>,
  schema: ZodType<T>,
  prompt: string,
): Promise<T> {
  try {
    const { object } = await generateObject({ schema, prompt });
    return object;
  } catch (firstError) {
    const validationHint =
      firstError instanceof Error ? firstError.message : "validation failed";
    logger.warn({ validationHint }, "AI output invalid, retrying once");

    const retryPrompt = `${prompt}\n\nPrevious output failed validation: ${validationHint}. Return valid JSON matching the schema.`;

    try {
      const { object } = await generateObject({ schema, prompt: retryPrompt });
      return object;
    } catch (retryError) {
      logger.error({ err: retryError }, "AI output invalid after retry");
      throw retryError;
    }
  }
}
