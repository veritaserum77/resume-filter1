
import type { Candidate } from './types';

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Alice Wonderland',
    phone: '555-0101',
    email: 'alice.w@example.com',
    resumeUrl: 'https://example.com/resumes/alice.pdf',
    skills: { 'Python': 9, 'React': 7, 'Node.js': 8, 'SQL': 6 },
    overallScore: 85,
  },
];
