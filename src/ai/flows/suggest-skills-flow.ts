
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
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
  prompt: `You are an expert recruitment analyst AI with deep knowledge of job roles and technical skill requirements.

Your task is to analyze the following job description and extract a concise list of the most **relevant, concrete, and technical skills** required for the role. Focus only on hard skills — tools, technologies, languages, and domain-specific expertise. Avoid generic terms like “communication” or “leadership.”

Return a list of 5 to 10 **unique, specific skills**, using short standardized names (e.g., "Python", "SQL", "React", "AWS", "Project Management", "Data Analysis").

Job Description:
---
{{{jobDescription}}}
---

Respond with only the list of skills in bullet points or array format.`,
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
