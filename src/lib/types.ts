
export interface SkillParameter {
  id: string;
  name: string;
  weight: number;
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  resumeUrl: string;
  skills: Record<string, number>; // e.g., { "Python": 8, "React": 7 }
  overallScore: number; // Percentage 0-100
}

export interface Shortlist {
  id: string;
  title: string;
  jobTitle: string;
  candidateCount: number;
  lastModified: string;
  isDraft: boolean;
  jobDescription: string;
  parameters: SkillParameter[];
  candidates: Candidate[];
}
