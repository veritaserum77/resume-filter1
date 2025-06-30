'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const suggestSkills = async (jobDescription: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analyze this job description and return ONLY a JSON array of required technical skills: ${jobDescription}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error('AI suggestion failed:', error);
    throw new Error('Failed to generate suggestions');
  }
};
