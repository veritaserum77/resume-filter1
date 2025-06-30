import { suggestSkills } from '@/actions/suggest-skills';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { jobDescription } = await request.json();
  
  try {
    const skills = await suggestSkills(jobDescription);
    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
