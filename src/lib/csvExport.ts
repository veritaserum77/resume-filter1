import type { Candidate, SkillParameter } from './types';

export function exportCandidatesToCSV(
  candidates: Candidate[],
  parameters: SkillParameter[],
  filename: string = 'candidates.csv'
): void {
  if (!candidates.length) return;

  const headers = [
    'Candidate Name',
    'Phone Number',
    'Email',
    ...parameters.map(p => `${p.name} Score`),
    'Overall Score (%)',
  ];

  const csvRows = [headers.join(',')];

  candidates.forEach(candidate => {
    const row = [
      `"${candidate.name.replace(/"/g, '""')}"`,
      `"${candidate.phone.replace(/"/g, '""')}"`,
      `"${candidate.email.replace(/"/g, '""')}"`,
      ...parameters.map(p => candidate.skills[p.name]?.toString() || '0'),
      candidate.overallScore.toString(),
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
