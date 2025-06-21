
'use server';
/**
 * @fileOverview An AI flow to suggest skills based on a job description.
 *
 * - suggestSkills - A function that suggests skills.
 * - SuggestSkillsInput - The input type for the suggestSkills function.
 * - SuggestSkillsOutput - The return type for the suggestSkills function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestSkillsInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
});
export type SuggestSkillsInput = z.infer<typeof SuggestSkillsInputSchema>;

const SuggestSkillsOutputSchema = z.object({
  skills: z
    .array(z.string().describe('A single, relevant technical or soft skill.'))
    .describe('A list of 5 to 10 key skills extracted from the job description.'),
});
export type SuggestSkillsOutput = z.infer<typeof SuggestSkillsOutputSchema>;

export async function suggestSkills(input: SuggestSkillsInput): Promise<SuggestSkillsOutput> {
  return suggestSkillsFlow(input);
}

const suggestSkillsPrompt = ai.definePrompt({
  name: 'suggestSkillsPrompt',
  input: { schema: SuggestSkillsInputSchema },
  output: { schema: SuggestSkillsOutputSchema },
  prompt: `You are an expert recruitment assistant. Analyze the following job description and identify the most important skills required for the role.
Focus on concrete, specific skills (e.g., "React", "Python", "Project Management", "Go", "SQL") rather than generic phrases.
Extract a list of 5 to 10 key skills.

Job Description:
---
{{{jobDescription}}}
---

Based on the description, provide the list of skills.`,
});

const suggestSkillsFlow = ai.defineFlow(
  {
    name: 'suggestSkillsFlow',
    inputSchema: SuggestSkillsInputSchema,
    outputSchema: SuggestSkillsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestSkillsPrompt(input);
    return output!;
  }
);
