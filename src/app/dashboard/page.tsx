'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { Shortlist } from '@/lib/types';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getJDHistory } from '@/lib/api';

const ShortlistCard = ({ shortlist, onDelete }: { shortlist: Shortlist; onDelete: () => void }) => {
  return (
    <AlertDialog>
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
        <CardFooter className="flex items-center justify-between gap-2">
          <Button asChild variant="outline" className="flex-grow">
            <Link href={/create?id=${shortlist.id}}>
              <Edit className="mr-2 h-4 w-4" />
              {shortlist.isDraft ? 'Continue Draft' : 'View Shortlist'}
            </Link>
          </Button>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="flex-shrink-0" aria-label="Delete shortlist">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the shortlist "{shortlist.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function DashboardPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [drafts, setDrafts] = useState<Shortlist[]>([]);
  const { toast } = useToast();

  const loadDrafts = () => {
    const storedShortlistsJSON = localStorage.getItem('resumerank_shortlists');
    let allShortlists: Shortlist[] = [];
    if (storedShortlistsJSON) {
      try {
        allShortlists = JSON.parse(storedShortlistsJSON);
      } catch (error) {
        console.error("Failed to parse shortlists from localStorage", error);
        allShortlists = [];
        localStorage.setItem('resumerank_shortlists', JSON.stringify([]));
      }
    }
    setDrafts(allShortlists.filter(s => s.isDraft));
  };

  useEffect(() => {
    const fetchServerShortlists = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const data = await getJDHistory(token);
        const serverShortlists = data.history.map((item: any) => ({
          id: item.jd_id,
          title: item.job_title,
          jobTitle: item.job_title,
          candidateCount: 0,
          lastModified: new Date().toLocaleDateString(),
          isDraft: false,
        }));
        setShortlists(serverShortlists);
      } catch (error) {
        console.error("Failed to fetch shortlists from backend", error);
      }
    };

    fetchServerShortlists();
    loadDrafts();
  }, []);

  const handleDelete = (id: string, title: string) => {
    const allShortlists: Shortlist[] = JSON.parse(localStorage.getItem('resumerank_shortlists') || '[]');
    const updatedShortlists = allShortlists.filter(s => s.id !== id);
    localStorage.setItem('resumerank_shortlists', JSON.stringify(updatedShortlists));
    loadDrafts();
    toast({
      title: "Shortlist Deleted",
      description: The shortlist "${title}" has been removed.,
      className: "bg-accent text-accent-foreground",
    });
  };

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
                <ShortlistCard key={shortlist.id} shortlist={shortlist} onDelete={() => handleDelete(shortlist.id, shortlist.title)} />
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
                <ShortlistCard key={draft.id} shortlist={draft} onDelete={() => handleDelete(draft.id, draft.title)} />
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
