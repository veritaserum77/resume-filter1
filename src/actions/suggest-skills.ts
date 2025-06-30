// src/actions/suggest-skills.ts
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const suggestSkills = async (input: { jobDescription: string }): Promise<{ skills: string[] }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are an expert recruitment analyst AI with deep knowledge of job roles and technical skill requirements.

Your task is to analyze the following job description and extract a concise list of the most relevant, concrete, and technical skills required for the role. Focus only on hard skills — tools, technologies, languages, and domain-specific expertise. Avoid generic terms like "communication" or "leadership."

Return a list of 5 to 10 unique, specific skills, using short standardized names (e.g., "Python", "SQL", "React", "AWS", "Project Management", "Data Analysis").

Job Description:
---
${input.jobDescription}
---

Respond with ONLY a JSON array of skills: ["skill1", "skill2", ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response (remove markdown if present)
    const cleanText = text.replace(/```json|```/g, '').trim();
    const skills = JSON.parse(cleanText);
    
    return { skills };
  } catch (error) {
    console.error('AI suggestion failed:', error);
    throw new Error('Failed to generate suggestions');
  }
};
