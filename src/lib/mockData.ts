
import type { Candidate, Shortlist } from './types';

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

export const mockShortlists: Shortlist[] = [
  {
    id: 'shortlist-1',
    title: 'Senior Frontend Engineers',
    jobTitle: 'Frontend Engineer',
    candidateCount: 15,
    lastModified: '2 days ago',
    isDraft: false,
  },
  {
    id: 'shortlist-2',
    title: 'Data Science Q3 Hiring',
    jobTitle: 'Data Scientist',
    candidateCount: 8,
    lastModified: '5 days ago',
    isDraft: false,
  },
  {
    id: 'shortlist-3',
    title: 'Backend Devs (Go)',
    jobTitle: 'Backend Developer',
    candidateCount: 22,
    lastModified: '1 week ago',
    isDraft: false,
  },
  {
    id: 'draft-1',
    title: 'UX/UI Designer Role',
    jobTitle: 'UX/UI Designer',
    candidateCount: 5,
    lastModified: '3 hours ago',
    isDraft: true,
  },
  {
    id: 'draft-2',
    title: 'Project Manager (Initial)',
    jobTitle: 'Project Manager',
    candidateCount: 2,
    lastModified: 'yesterday',
    isDraft: true,
  }
];
