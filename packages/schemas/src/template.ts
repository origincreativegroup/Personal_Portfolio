import { z } from 'zod';

export const Template = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slots: z.array(z.string()),
  rules: z.record(z.string(), z.any()).optional(),
});

export type TemplateT = z.infer<typeof Template>;
