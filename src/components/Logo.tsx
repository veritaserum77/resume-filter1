import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary hover:text-primary/90 transition-colors">
      <Briefcase className="h-6 w-6" />
      <span>ResumeRank</span>
    </Link>
  );
}
