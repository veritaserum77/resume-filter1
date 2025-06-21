
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
    jobDescription: 'Seeking an experienced Frontend Engineer to join our dynamic team...',
    parameters: [
      { id: 'p1', name: 'React', weight: 10 },
      { id: 'p2', name: 'TypeScript', weight: 8 },
      { id: 'p3', name: 'CSS-in-JS', weight: 6 },
    ],
    candidates: [],
  },
  {
    id: 'shortlist-2',
    title: 'Data Science Q3 Hiring',
    jobTitle: 'Data Scientist',
    candidateCount: 8,
    lastModified: '5 days ago',
    isDraft: false,
    jobDescription: '',
    parameters: [],
    candidates: [],
  },
  {
    id: 'shortlist-3',
    title: 'Backend Devs (Go)',
    jobTitle: 'Backend Developer',
    candidateCount: 22,
    lastModified: '1 week ago',
    isDraft: false,
    jobDescription: '',
    parameters: [],
    candidates: [],
  },
  {
    id: 'draft-1',
    title: 'UX/UI Designer Role',
    jobTitle: 'UX/UI Designer',
    candidateCount: 5,
    lastModified: '3 hours ago',
    isDraft: true,
    jobDescription: 'Looking for a creative UX/UI designer...',
    parameters: [
      { id: 'p4', name: 'Figma', weight: 10 },
      { id: 'p5', name: 'User Research', weight: 9 },
    ],
    candidates: [],
  },
  {
    id: 'draft-2',
    title: 'Project Manager (Initial)',
    jobTitle: 'Project Manager',
    candidateCount: 2,
    lastModified: 'yesterday',
    isDraft: true,
    jobDescription: '',
    parameters: [],
    candidates: [],
  }
];
