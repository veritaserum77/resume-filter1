'use client';

import { useState, useMemo, useEffect, ChangeEvent, Suspense } from 'react';
import type { Candidate, SkillParameter, Shortlist } from '@/lib/types';
import { exportCandidatesToCSV } from '@/lib/csvExport';
import { useRouter, useSearchParams } from 'next/navigation';
import { suggestSkills } from '@/ai/flows/suggest-skills-flow';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import {
  Trash2,
  PlusCircle,
  ArrowUpDown,
  UploadCloud,
  FileText,
  Filter,
  Files,
  Search,
  CheckCircle,
  LinkIcon,
  Sparkles,
  Loader2,
  ClipboardList,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const INITIAL_PARAMETERS: SkillParameter[] = [];

function CreatePageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();

  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tempId] = useState(() => `sl-${Date.now()}`);

  // Shortlist-specific state
  const [shortlistTitle, setShortlistTitle] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [gdriveLink, setGdriveLink] = useState('');

  // Staged vs. Confirmed parameters
  const [parameters, setParameters] = useState<SkillParameter[]>(INITIAL_PARAMETERS);
  const [confirmedParameters, setConfirmedParameters] = useState<SkillParameter[]>(INITIAL_PARAMETERS);

  // Staging new parameters
  const [newParamName, setNewParamName] = useState('');
  const [newParamWeight, setNewParamWeight] = useState<number>(5);

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // AI Suggestions
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [overallScoreFilter, setOverallScoreFilter] = useState<number | ''>('');
  const [skillFilters, setSkillFilters] = useState<Array<{ skillName: string; minScore: number | '' }>>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isNewShortlistModalOpen, setIsNewShortlistModalOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
  const id = searchParams.get('id');
  if (id) {
    setShortlistId(id);
    const token = localStorage.getItem('token');
    if (token) {
      fetchShortlistHistory(token, id); // ✅ Pass id directly
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
    const res = await fetch('https://backend-f2yv.onrender.com/jd/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch shortlist history');
    }

    const data = await res.json();

    // ✅ Debug logs to verify values
    console.log("Fetched history from backend:", data.history);
    console.log("shortlistId from URL:", id);

    const selectedShortlist = data.history.find((s: any) => s.jd_id === id);

    if (selectedShortlist) {
      setShortlistTitle(selectedShortlist.job_title || '');
      setJobTitle(selectedShortlist.job_title || '');
      setJobDescription(selectedShortlist.job_description || '');

      const params: SkillParameter[] = Object.entries(selectedShortlist.skills || {}).map(([name, weight]) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        weight: typeof weight === 'object' && '$numberInt' in weight ? parseInt(weight.$numberInt) : (weight as number),
      }));
      setParameters(params);
      setConfirmedParameters(params);
      setCandidates(selectedShortlist.candidates || []);
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

  // Update skill filters when confirmed parameters change
  useEffect(() => {
    if (!isLoaded) return;
    setSkillFilters(prevFilters => {
      const confirmedSkillNames = new Set(confirmedParameters.map(p => p.name));
      const existingFiltersMap = new Map(prevFilters.map(f => [f.skillName, f.minScore]));

      const updatedFilters = confirmedParameters.map(p => ({
        skillName: p.name,
        minScore: existingFiltersMap.get(p.name) ?? '',
      }));

      return updatedFilters.filter(f => confirmedSkillNames.has(f.skillName));
    });
  }, [confirmedParameters, isLoaded]);

  const handleSetDetails = () => {
    if (!shortlistTitle.trim() || !jobTitle.trim()) {
      toast({ title: "Details Required", description: "Please provide both a Shortlist Title and a Job Title to continue.", variant: "destructive" });
      return;
    }
    setIsNewShortlistModalOpen(false);
  };

  const handleAddParameter = () => {
    if (newParamName.trim() === '') {
      toast({ title: "Error", description: "Skill name cannot be empty.", variant: "destructive" });
      return;
    }
    if (parameters.find(p => p.name.toLowerCase() === newParamName.toLowerCase())) {
      toast({ title: "Error", description: "Skill already exists in the staged list.", variant: "destructive" });
      return;
    }
    setParameters([...parameters, { id: Date.now().toString(), name: newParamName, weight: newParamWeight }]);
    setNewParamName('');
    setNewParamWeight(5);
    toast({ title: "Skill Staged", description: `Skill "${newParamName}" staged. Press 'Confirm & Save' to apply.`, className: "bg-accent text-accent-foreground" });
  };

  const handleRemoveParameter = (id: string) => {
    const removedParam = parameters.find(p => p.id === id);
    setParameters(parameters.filter(p => p.id !== id));
    if (removedParam) {
      toast({ title: "Skill Staged for Removal", description: `Skill "${removedParam.name}" staged for removal. Press 'Confirm & Save' to apply.`, className: "bg-accent text-accent-foreground" });
    }
  };

  const handleConfirmAndSave = async () => {
    if (!shortlistTitle.trim() || !jobTitle.trim()) {
      toast({ title: "Name Required", description: "Please provide a Shortlist Title and Job Title before saving.", variant: "destructive" });
      return;
    }

    setConfirmedParameters([...parameters]);

    const shortlistData: Shortlist = {
      id: shortlistId || tempId,
      title: shortlistTitle,
      jobTitle,
      jobDescription,
      parameters,
      candidates,
      candidateCount: candidates.length,
      lastModified: '2025-06-28 01:10 PM IST',
      isDraft: false,
    };

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save the shortlist to the database.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch('https://backend-f2yv.onrender.com/jd/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_title: jobTitle,
          job_description: jobDescription,
          skills: Object.fromEntries(parameters.map(p => [p.name, p.weight]))
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Submission failed');
      }

      toast({
        title: "Submitted Successfully",
        description: `Shortlist "${shortlistTitle}" saved to database.`,
        className: "bg-accent text-accent-foreground",
      });
      setShortlistId(shortlistData.id);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: `Failed to save to database: ${error.message}`,
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

  const handleAddSuggestedSkill = (skillName: string) => {
    if (parameters.find(p => p.name.toLowerCase() === skillName.toLowerCase())) {
      toast({ title: "Skill Exists", description: `"${skillName}" is already in your staged parameters.`, variant: "default" });
      return;
    }
    setNewParamName(skillName);
    setSuggestedSkills(prev => prev.filter(s => s !== skillName));
    toast({
      title: "Skill Selected",
      description: `"${skillName}" is loaded. Adjust its weight and click 'Add Skill' to stage it.`,
      className: "bg-accent text-accent-foreground"
    });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(lowerSearchTerm) ||
        c.email.toLowerCase().includes(lowerSearchTerm) ||
        c.phone.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (overallScoreFilter !== '') {
      filtered = filtered.filter(c => c.overallScore >= Number(overallScoreFilter));
    }

    skillFilters.forEach(filter => {
      if (filter.minScore !== '') {
        filtered = filtered.filter(c => (c.skills[filter.skillName] || 0) >= Number(filter.minScore));
      }
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'name' || sortConfig.key === 'email') {
          valA = a[sortConfig.key].toLowerCase();
          valB = b[sortConfig.key].toLowerCase();
        } else if (sortConfig.key === 'overallScore') {
          valA = a.overallScore;
          valB = b.overallScore;
        } else {
          valA = a.skills[sortConfig.key] || 0;
          valB = b.skills[sortConfig.key] || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [candidates, searchTerm, overallScoreFilter, skillFilters, sortConfig]);

  const handleExport = () => {
    if (filteredAndSortedCandidates.length === 0) {
      toast({ title: "No Data", description: "No data to export.", variant: "destructive" });
      return;
    }
    exportCandidatesToCSV(filteredAndSortedCandidates, confirmedParameters, 'resumerank_export.csv');
    toast({ title: "Export Started", description: "Your CSV export has started.", className: "bg-accent text-accent-foreground" });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/70" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    return <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <Dialog open={isNewShortlistModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (!shortlistId) {
              router.push('/dashboard');
            }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Resume Upload Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <UploadCloud className="h-5 w-5 text-primary" /> Resume Upload
              </CardTitle>
              <CardDescription>Upload resumes (PDF/DOCX) or provide a Google Drive link.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md aspect-video bg-muted/20 hover:border-primary transition-colors cursor-pointer">
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop files here or click to browse</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Max 500 files. PDF, DOCX supported.</p>
                <Input type="file" className="sr-only" multiple disabled />
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="gdriveLink" className="text-sm font-medium">Or paste Google Drive Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="gdriveLink"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={gdriveLink}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setGdriveLink(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">Link to a folder or individual resume files.</p>
              </div>
            </CardContent>
          </Card>

          {/* Job Description Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <FileText className="h-5 w-5 text-primary" /> Job Description
              </CardTitle>
              <CardDescription>Paste the full job description. This provides context for scoring.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] lg:min-h-[270px] resize-y"
              />
            </CardContent>
          </Card>

          {/* Custom Parameters Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <PlusCircle className="h-5 w-5 text-primary" /> Custom Parameters
              </CardTitle>
              <CardDescription>Define skills and their importance (1-10). Confirm to apply and save.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters.map((param) => (
                <div key={param.id} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/30">
                  <span className="flex-1 font-medium">{param.name}</span>
                  <span className="text-sm text-muted-foreground">Weight: {param.weight}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveParameter(param.id)} aria-label={`Remove ${param.name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="space-y-3 pt-4 border-t">
                <Input
                  type="text"
                  placeholder="New Skill Name (e.g., JavaScript)"
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
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
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleAddParameter} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                  </Button>
                  <Button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions || !jobDescription.trim()} variant="outline">
                    {isGeneratingSuggestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Suggest
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {suggestedSkills.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-5 w-5 text-primary" /> AI Skill Suggestions
              </CardTitle>
              <CardDescription>Click a skill to load it into the form above. You can then adjust its weight before adding.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((skill, index) => (
                  <Button key={index} variant="secondary" onClick={() => handleAddSuggestedSkill(skill)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {skill}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center my-6">
          <Button onClick={handleConfirmAndSave} size="lg" className="w-full max-w-xs">
            <CheckCircle className="mr-2 h-5 w-5" /> Confirm & Save Shortlist
          </Button>
        </div>

        {/* Candidate Scores Card */}
        <Card className="shadow-lg lg:col-span-3">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2 font-headline">
                <ClipboardList className="h-5 w-5 text-primary" />
                Candidate Scores
              </CardTitle>
              <CardDescription>Found {filteredAndSortedCandidates.length} candidate(s). Table reflects confirmed skills.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-48 md:w-64"
                />
              </div>
              <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Open Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-4" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filters</h4>
                    <p className="text-sm text-muted-foreground">
                      Adjust filters to refine candidate list.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="overallScoreFilterPopover">Min. Overall Score (%)</Label>
                      <Input
                        id="overallScoreFilterPopover"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 80"
                        value={overallScoreFilter}
                        onChange={(e) => setOverallScoreFilter(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                    {skillFilters.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="font-medium">Min. Skill Scores (Active)</Label>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 max-h-48 overflow-y-auto">
                          {skillFilters.map((filter, index) => (
                            <div key={filter.skillName}>
                              <Label htmlFor={`skillFilterPopover-${filter.skillName}`} className="text-xs">{filter.skillName}</Label>
                              <Input
                                id={`skillFilterPopover-${filter.skillName}`}
                                type="number"
                                min="0"
                                max="10"
                                placeholder="e.g., 7"
                                value={filter.minScore}
                                onChange={(e) => {
                                  const newFilters = [...skillFilters];
                                  newFilters[index].minScore = e.target.value === '' ? '' : Number(e.target.value);
                                  setSkillFilters(newFilters);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setIsFilterPopoverOpen(false)} className="w-full">Apply Filters</Button>
                </PopoverContent>
              </Popover>
              <Button onClick={handleExport} variant="outline" size="sm" className="flex-shrink-0">
                <Files className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">Name {getSortIcon('name')}</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead onClick={() => handleSort('email')} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">Email {getSortIcon('email')}</TableHead>
                    <TableHead className="whitespace-nowrap">Resume</TableHead>
                    {confirmedParameters.map(param => (
                      <TableHead key={param.id} onClick={() => handleSort(param.name)} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">
                        {param.name} {getSortIcon(param.name)}
                      </TableHead>
                    ))}
                    <TableHead onClick={() => handleSort('overallScore')} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">Overall Score {getSortIcon('overallScore')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCandidates.length > 0 ? (
                    filteredAndSortedCandidates.map(candidate => (
                      <TableRow key={candidate.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium whitespace-nowrap">{candidate.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{candidate.phone}</TableCell>
                        <TableCell className="whitespace-nowrap">{candidate.email}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" /> View
                          </a>
                        </TableCell>
                        {confirmedParameters.map(param => (
                          <TableCell key={`${candidate.id}-${param.id}`} className="text-center">
                            {candidate.skills[param.name] || 0}/10
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-semibold text-primary">{candidate.overallScore}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5 + confirmedParameters.length} className="h-24 text-center text-muted-foreground">
                        No candidates match your filters, or no skills confirmed for display.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
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
