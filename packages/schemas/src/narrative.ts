import { z } from 'zod';

export const NarrativeDraft = z.object({
  projectId: z.string().uuid(),
  executiveSummary: z.string(),
  highlights: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type NarrativeDraftT = z.infer<typeof NarrativeDraft>;
