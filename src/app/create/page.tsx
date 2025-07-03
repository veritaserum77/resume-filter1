'use client';

import { useState, useMemo, useEffect, ChangeEvent, Suspense } from 'react';
import type { Candidate, SkillParameter, Shortlist } from '@/lib/types';
import { exportCandidatesToCSV } from '@/lib/csvExport';
import { useRouter, useSearchParams } from 'next/navigation';
import { submitJD, updateJD } from '@/lib/api';
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
  // ... (keep all existing state and functions exactly the same until the return statement)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">
            {/* Combined Resume Upload and Job Description Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <FileText className="h-5 w-5 text-primary" /> Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                {/* Job Description Section */}
                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <Textarea
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>

                {/* Resume Upload Section */}
                <div className="space-y-2">
                  <Label>Resume Source</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={gdriveLink}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setGdriveLink(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/70">Link to a Google Drive folder</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions Card */}
            {suggestedSkills.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <Sparkles className="h-5 w-5 text-primary" /> AI Skill Suggestions
                  </CardTitle>
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

            {/* Confirm & Save Button */}
            <div className="flex justify-center">
              <Button onClick={handleConfirmAndSave} size="lg" className="w-full max-w-xs">
                <CheckCircle className="mr-2 h-5 w-5" /> Confirm & Save Shortlist
              </Button>
            </div>

            {/* Candidate Scores Table */}
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Candidate Scores
                  </CardTitle>
                  <CardDescription>Found {filteredAndSortedCandidates.length} candidate(s)</CardDescription>
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
          </div>

          {/* Right Column - Skills Panel */}
          <div className="lg:w-80 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <PlusCircle className="h-5 w-5 text-primary" /> Skills Parameters
                </CardTitle>
                <CardDescription>Define skills and their importance (1-10)</CardDescription>
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
        </div>
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
