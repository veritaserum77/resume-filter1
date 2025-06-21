
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, Users, Clock, Edit } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { Shortlist } from '@/lib/types';
import { mockShortlists } from '@/lib/mockData';

const ShortlistCard = ({ shortlist }: { shortlist: Shortlist }) => {
  return (
    <Card className="hover:shadow-lg hover:border-primary/50 transition-all flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-headline">{shortlist.title}</CardTitle>
        <CardDescription>{shortlist.jobTitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{shortlist.candidateCount} Candidates</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{shortlist.lastModified}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/create">
            <Edit className="mr-2 h-4 w-4" />
            {shortlist.isDraft ? 'Continue Draft' : 'View Shortlist'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function DashboardPage() {
  const shortlists = mockShortlists.filter(s => !s.isDraft);
  const drafts = mockShortlists.filter(s => s.isDraft);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">Your Dashboard</h1>
          <Button asChild>
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Shortlist
            </Link>
          </Button>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            Your Shortlists
          </h2>
          {shortlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shortlists.map(shortlist => (
                <ShortlistCard key={shortlist.id} shortlist={shortlist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg bg-card">
                <p className="text-muted-foreground mb-4">You haven't created any shortlists yet.</p>
                <Button asChild>
                    <Link href="/create">Create Your First Shortlist</Link>
                </Button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <Edit className="h-6 w-6 text-primary" />
            Drafts
          </h2>
          {drafts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map(draft => (
                <ShortlistCard key={draft.id} shortlist={draft} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg bg-card">
                <p className="text-muted-foreground">You have no saved drafts.</p>
             </div>
          )}
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ResumeRank. Advanced Resume Screening.
      </footer>
    </div>
  );
}
