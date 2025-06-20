
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Candidate, SkillParameter } from '@/lib/types';
import { mockCandidates } from '@/lib/mockData';
import { exportCandidatesToCSV } from '@/lib/csvExport';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Trash2, PlusCircle, ArrowUpDown, UploadCloud, FileText, Filter, Files, Search, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';

const INITIAL_PARAMETERS: SkillParameter[] = [
  { id: 'param1', name: 'Python', weight: 9 },
  { id: 'param2', name: 'React', weight: 7 },
];

export default function DashboardPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [parameters, setParameters] = useState<SkillParameter[]>(INITIAL_PARAMETERS);
  const [confirmedParameters, setConfirmedParameters] = useState<SkillParameter[]>(INITIAL_PARAMETERS);
  
  const [newParamName, setNewParamName] = useState('');
  const [newParamWeight, setNewParamWeight] = useState<number>(5);

  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [overallScoreFilter, setOverallScoreFilter] = useState<number | ''>('');
  const [skillFilters, setSkillFilters] = useState<Array<{ skillName: string; minScore: number | '' }>>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setSkillFilters(prevFilters => {
      const confirmedSkillNames = new Set(confirmedParameters.map(p => p.name));
      const existingFiltersMap = new Map(prevFilters.map(f => [f.skillName, f.minScore]));
      
      const updatedFilters = confirmedParameters.map(p => ({
        skillName: p.name,
        minScore: existingFiltersMap.get(p.name) ?? '',
      }));
      
      return updatedFilters.filter(f => confirmedSkillNames.has(f.skillName));
    });
  }, [confirmedParameters]);


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
    toast({ title: "Skill Staged", description: `Skill "${newParamName}" staged. Press 'Confirm Skill Configuration' to apply.`, className: "bg-accent text-accent-foreground" });
  };

  const handleRemoveParameter = (id: string) => {
    const removedParam = parameters.find(p => p.id === id);
    setParameters(parameters.filter(p => p.id !== id));
    if (removedParam) {
      toast({ title: "Skill Staged for Removal", description: `Skill "${removedParam.name}" staged for removal. Press 'Confirm Skill Configuration' to apply.`, className: "bg-accent text-accent-foreground" });
    }
  };

  const handleConfirmSkillChanges = () => {
    setConfirmedParameters([...parameters]);
    toast({ title: "Success", description: "Skill configuration confirmed. Table and filters updated.", className: "bg-accent text-accent-foreground" });
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
      toast({ title: "No Data", description: "No data to export.", variant: "destructive"});
      return;
    }
    exportCandidatesToCSV(filteredAndSortedCandidates, confirmedParameters, 'resumerank_export.csv');
    toast({ title: "Export Started", description: "Your CSV export has started.", className: "bg-accent text-accent-foreground" });
  };
  
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/70" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><UploadCloud className="h-5 w-5 text-primary" /> Resume Upload</CardTitle>
                <CardDescription>Upload up to 500 resumes (PDF/DOCX). Placeholder UI.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md aspect-video bg-muted/20 hover:border-primary transition-colors cursor-pointer">
                  <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Max 500 files. PDF, DOCX supported.</p>
                  <Input type="file" className="sr-only" disabled />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><FileText className="h-5 w-5 text-primary" /> Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px] resize-y"
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><PlusCircle className="h-5 w-5 text-primary" /> Custom Parameters</CardTitle>
                <CardDescription>Define skills and their importance (1-10). Confirm to apply changes.</CardDescription>
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
                      min={1} max={10} step={1}
                      value={[newParamWeight]}
                      onValueChange={(value) => setNewParamWeight(value[0])}
                    />
                  </div>
                  <Button onClick={handleAddParameter} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill to Staging
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleConfirmSkillChanges} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Skill Configuration
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary"><path d="M16.5 12A2.5 2.5 0 0019 9.5A2.5 2.5 0 0016.5 7A2.5 2.5 0 0014 9.5A2.5 2.5 0 0016.5 12M9 11.5A2.5 2.5 0 0011.5 9A2.5 2.5 0 009 6.5A2.5 2.5 0 006.5 9A2.5 2.5 0 009 11.5M16.5 14A2.5 2.5 0 0014 16.5A2.5 2.5 0 0016.5 19A2.5 2.5 0 0019 16.5A2.5 2.5 0 0016.5 14M9 13.5A2.5 2.5 0 006.5 16A2.5 2.5 0 009 18.5A2.5 2.5 0 0011.5 16A2.5 2.5 0 009 13.5Z"></path></svg>
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
                            min="0" max="100"
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
                                  min="0" max="10"
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
                          <TableCell colSpan={4 + confirmedParameters.length} className="h-24 text-center text-muted-foreground">
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
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ResumeRank. Advanced Resume Screening.
      </footer>
    </div>
  );
}

