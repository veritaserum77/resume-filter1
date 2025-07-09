'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAIResults, submitJD, updateJD } from '@/lib/api';
import { exportCandidatesToCSV } from '@/lib/csvExport';
import { suggestSkills } from '@/ai/flows/suggest-skills-flow';

import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  FileText,
  Loader2,
  CheckCircle,
  PlusCircle,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SkillParameter {
  id: string;
  name: string;
  weight: number;
}

interface Candidate {
  name: string;
  jd_score: number;
  skills_score: number;
  overall_score: number;
  description: string;
}

function CreatePageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();

  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNewShortlistModalOpen, setIsNewShortlistModalOpen] = useState(false);

  // Shortlist details
  const [shortlistTitle, setShortlistTitle] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [gdriveLink, setGdriveLink] = useState('');

  // Skills parameters
  const [parameters, setParameters] = useState<SkillParameter[]>([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamWeight, setNewParamWeight] = useState(5);

  // Candidate results
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [aiResultsReady, setAIResultsReady] = useState(false);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [showCandidateTable, setShowCandidateTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scoreFilter, setScoreFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 5;

  // Suggestion state
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const jdId = searchParams.get('id');

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter((candidate) => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (!scoreFilter) return true;
      if (scoreFilter === '>90') return candidate.overall_score > 90;
      if (scoreFilter === '>80') return candidate.overall_score > 80;
      if (scoreFilter === '>70') return candidate.overall_score > 70;
      if (scoreFilter === '<=60') return candidate.overall_score <= 60;
      return true;
    })
    .sort((a, b) => {
      // Explicit descending sort by overall_score
      if (a.overall_score > b.overall_score) return -1;
      if (a.overall_score < b.overall_score) return 1;
      return 0;
    });

  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setShortlistId(id);
      const token = localStorage.getItem('token');
      if (token) {
        fetchShortlistHistory(token, id);
      } else {
        toast({
          title: "Authentication Required",
          description: "Please log in to view the shortlist.",
          variant: "destructive",
        });
        router.push('/dashboard');
      }
    } else {
      setIsNewShortlistModalOpen(true);
    }
    setIsLoaded(true);
  }, [searchParams, router]);

  const fetchShortlistHistory = async (token: string, id: string) => {
    try {
      const res = await fetch('http://localhost:8000/jd/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch shortlist history');

      const data = await res.json();
      const selectedShortlist = data.history.find((s: any) => s.jd_id === id);

      if (selectedShortlist) {
        setShortlistTitle(selectedShortlist.job_title || '');
        setJobTitle(selectedShortlist.job_title || '');
        setJobDescription(selectedShortlist.job_description || '');

        const params = Object.entries(selectedShortlist.skills || {}).map(([name, weight]) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name,
          weight: typeof weight === 'object' && '$numberInt' in weight ? 
            parseInt(weight.$numberInt) : 
            (weight as number),
        }));
        setParameters(params);
        
        // Ensure candidates are sorted when loaded
        const sortedCandidates = (selectedShortlist.candidates || []).sort((a: Candidate, b: Candidate) => 
          b.overall_score - a.overall_score
        );
        setCandidates(sortedCandidates);
        
        setAIResultsReady(true);
      } else {
        throw new Error('Shortlist not found');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Could not load shortlist: ${error.message}`,
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  };

  const handleSetDetails = () => {
    if (!shortlistTitle.trim() || !jobTitle.trim()) {
      toast({ 
        title: "Details Required", 
        description: "Please provide both a Shortlist Title and a Job Title to continue.", 
        variant: "destructive" 
      });
      return;
    }
    setIsNewShortlistModalOpen(false);
  };

  const handleAddParameter = () => {
    if (newParamName.trim() === '') {
      toast({ 
        title: "Error", 
        description: "Skill name cannot be empty.", 
        variant: "destructive" 
      });
      return;
    }
    if (parameters.some(p => p.name.toLowerCase() === newParamName.toLowerCase())) {
      toast({ 
        title: "Error", 
        description: "Skill already exists in the list.", 
        variant: "destructive" 
      });
      return;
    }
    const newParam = { 
      id: Date.now().toString(), 
      name: newParamName.trim(), 
      weight: newParamWeight 
    };
    setParameters([...parameters, newParam]);
    setNewParamName('');
    setSuggestedSkills(suggestedSkills.filter(skill => skill !== newParamName)); // Remove from suggestions if added
    toast({ 
      title: "Skill Added", 
      description: `Skill "${newParam.name}" added with weight ${newParam.weight}.`, 
      className: "bg-accent text-accent-foreground" 
    });
  };

  const handleRemoveParameter = (id: string) => {
    const removedParam = parameters.find(p => p.id === id);
    if (!removedParam) return;
    
    setParameters(parameters.filter(p => p.id !== id));
    toast({ 
      title: "Skill Removed", 
      description: `Skill "${removedParam.name}" was removed.`, 
      className: "bg-accent text-accent-foreground" 
    });
  };

  const handleFetchAIResults = async () => {
    const token = localStorage.getItem('token');
    if (!token || !jdId) return;

    setIsFetchingAI(true);
    try {
      const res = await fetchAIResults(token, jdId);
      if (res?.results) {
        // Sort results immediately when received
        const sortedResults = res.results.sort((a: Candidate, b: Candidate) => 
          b.overall_score - a.overall_score
        );
        setCandidates(sortedResults);
        setShowCandidateTable(true);
        setCurrentPage(1);
        toast({ title: "AI Results Loaded", description: "Candidate scores updated." });
      }
    } catch (error) {
      toast({
        title: "Failed to Fetch Results",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingAI(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!shortlistTitle.trim() || !jobTitle.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide both a Shortlist Title and Job Title.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    const jdPayload = {
      job_title: jobTitle,
      job_description: jobDescription,
      skills: Object.fromEntries(parameters.map(p => [p.name, p.weight])),
      resume_drive_link: gdriveLink.trim() || undefined,
    };

    try {
      if (shortlistId) {
        await updateJD(token, shortlistId, jdPayload);
        toast({
          title: "JD Updated",
          className: "bg-accent text-accent-foreground",
        });
      } else {
        const res = await submitJD(token, jdPayload);
        setShortlistId(res.jd_id);
        toast({
          title: "JD Submitted",
          className: "bg-accent text-accent-foreground",
        });
      }
      setAIResultsReady(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during JD submission.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Job Description Required", description: "Please paste a job description first.", variant: "destructive" });
      return;
    }
    setIsGeneratingSuggestions(true);
    setSuggestedSkills([]);
    try {
      const result = await suggestSkills({ jobDescription });
      if (result && result.skills) {
        const newSuggestions = result.skills.filter(suggestedSkill =>
          !parameters.some(param => param.name.toLowerCase() === suggestedSkill.toLowerCase())
        );
        setSuggestedSkills(newSuggestions);
        if (newSuggestions.length > 0) {
          toast({ title: "Suggestions Ready", description: "AI has generated skill suggestions for you below.", className: "bg-accent text-accent-foreground" });
        } else if (result.skills.length > 0) {
          toast({ title: "Suggestions Ready", description: "All suggested skills are already in your parameters list.", className: "bg-accent text-accent-foreground" });
        } else {
          toast({ title: "No New Suggestions", description: "The AI could not generate new skill suggestions.", variant: "default" });
        }
      }
    } catch (error) {
      console.error("Failed to generate skill suggestions:", error);
      toast({ title: "Generation Failed", description: "An error occurred while generating suggestions. Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleAddSuggestedSkill = (skill: string) => {
    setNewParamName(skill);
    handleAddParameter();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <Dialog open={isNewShortlistModalOpen} onOpenChange={(open) => {
          if (!open && !shortlistId) {
            router.push('/dashboard');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Shortlist</DialogTitle>
              <DialogDescription>
                First, give your new shortlist a title and the associated job title.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="modalShortlistTitle">Shortlist Title</Label>
                <Input
                  id="modalShortlistTitle"
                  value={shortlistTitle}
                  onChange={(e) => setShortlistTitle(e.target.value)}
                  placeholder="e.g. Q4 Backend Engineers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modalJobTitle">Job Title</Label>
                <Input
                  id="modalJobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Go Developer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>Cancel</Button>
              <Button onClick={handleSetDetails}>Start Creating</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-8">
            {/* Job Details Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <FileText className="h-5 w-5 text-primary" /> Job Details
                </CardTitle>
                <CardDescription>Paste the full job description and provide a Google Drive link for resumes.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <Textarea
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paste Google Drive Link</Label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={gdriveLink}
                    onChange={(e) => setGdriveLink(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground/70">Link to a folder containing resumes</p>
                </div>
              </CardContent>
            </Card>

            {/* Confirm & Save Button */}
            <div className="flex justify-center my-6">
              <Button 
                onClick={handleConfirmAndSave} 
                size="lg" 
                className="w-full max-w-xs"
              >
                <CheckCircle className="mr-2 h-5 w-5" /> Confirm & Save Shortlist
              </Button>
            </div>

            {/* Button to View Candidate Table */}
            <div className="flex justify-center my-6">
              <Button
                onClick={handleFetchAIResults}
                disabled={!aiResultsReady}
                className="w-full max-w-xs bg-primary text-white"
              >
                {isFetchingAI ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="mr-2 h-4 w-4" />
                )}
                View Candidate Scores
              </Button>
            </div>
          </div>

          {/* Right Column - Skills Panel */}
          <div className="lg:w-80 space-y-6">
            <Card className="shadow-lg min-h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <PlusCircle className="h-5 w-5 text-primary" /> Skills Parameters
                </CardTitle>
                <CardDescription>Define skills and their importance (1-10).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {parameters.length > 0 ? (
                  parameters.map((param) => (
                    <div key={param.id} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/30">
                      <span className="flex-1 font-medium">{param.name}</span>
                      <span className="text-sm text-muted-foreground">Weight: {param.weight}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveParameter(param.id)} 
                        aria-label={`Remove ${param.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No skills added yet
                  </div>
                )}
                <div className="space-y-3 pt-4 border-t">
                  <Input
                    type="text"
                    placeholder="New Skill Name (e.g., JavaScript)"
                    value={newParamName}
                    onChange={(e) => setNewParamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddParameter()}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="newParamWeight" className="text-xs">Weight: {newParamWeight}</Label>
                    <Slider
                      id="newParamWeight"
                      min={1}
                      max={10}
                      step={1}
                      value={[newParamWeight]}
                      onValueChange={(value) => setNewParamWeight(value[0])}
                    />
                  </div>
                  <Button 
                    onClick={handleAddParameter} 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={!newParamName.trim()}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                  </Button>
                  <Button 
                    onClick={handleGenerateSuggestions} 
                    variant="outline"
                    disabled={!jobDescription.trim() || isGeneratingSuggestions}
                  >
                    {isGeneratingSuggestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Suggest Skills
                  </Button>
                </div>
                {suggestedSkills.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Suggested Skills:</p>
                    {suggestedSkills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
                        <span className="flex-1">{skill}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSuggestedSkill(skill)}
                          disabled={parameters.some(param => param.name.toLowerCase() === skill.toLowerCase())}
                        >
                          <PlusCircle className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog for Candidate Table */}
      <Dialog open={showCandidateTable} onOpenChange={setShowCandidateTable}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Candidate Scores</DialogTitle>
            <DialogDescription>
              View AI-ranked candidate scores based on your uploaded resumes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-sm"
              />
            </div>
            {/* Score Filters - Updated as requested */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={scoreFilter === null ? 'default' : 'outline'}
                onClick={() => {
                  setScoreFilter(null);
                  setCurrentPage(1);
                }}
              >
                All
              </Button>
              <Button
                variant={scoreFilter === '>90' ? 'default' : 'outline'}
                onClick={() => {
                  setScoreFilter('>90');
                  setCurrentPage(1);
                }}
              >
                Score > 90
              </Button>
              <Button
                variant={scoreFilter === '>80' ? 'default' : 'outline'}
                onClick={() => {
                  setScoreFilter('>80');
                  setCurrentPage(1);
                }}
              >
                Score > 80
              </Button>
              <Button
                variant={scoreFilter === '>70' ? 'default' : 'outline'}
                onClick={() => {
                  setScoreFilter('>70');
                  setCurrentPage(1);
                }}
              >
                Score > 70
              </Button>
              <Button
                variant={scoreFilter === '<=60' ? 'default' : 'outline'}
                onClick={() => {
                  setScoreFilter('<=60');
                  setCurrentPage(1);
                }}
              >
                Score ≤ 60
              </Button>
            </div>
            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => exportCandidatesToCSV(filteredCandidates, parameters)}
                variant="outline"
                disabled={filteredCandidates.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%] whitespace-nowrap">Rank</TableHead>
                  <TableHead className="w-[20%] whitespace-nowrap">Name</TableHead>
                  <TableHead className="w-[15%] whitespace-nowrap">JD Score (30)</TableHead>
                  <TableHead className="w-[15%] whitespace-nowrap">Skills Score (70)</TableHead>
                  <TableHead className="w-[15%] whitespace-nowrap">Overall (100)</TableHead>
                  <TableHead className="w-[25%] whitespace-normal">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCandidates.map((candidate, index) => (
                    <TableRow key={index}>
                      <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell>{candidate.name}</TableCell>
                      <TableCell>{(candidate.jd_score * 30).toFixed(2)}</TableCell>
                      <TableCell>{candidate.skills_score.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {candidate.overall_score.toFixed(2)}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        {candidate.description || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((p) =>
                  p * itemsPerPage < filteredCandidates.length ? p + 1 : p
                )
              }
              disabled={currentPage * itemsPerPage >= filteredCandidates.length}
            >
              Next
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowCandidateTable(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ResumeRank. Advanced Resume Screening.
      </footer>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
