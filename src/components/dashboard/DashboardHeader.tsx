'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export function DashboardHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any stored session (adjust based on your auth system)
    localStorage.clear(); 
    sessionStorage.clear(); 

    // Redirect to signup/login page
    router.push('/app/page.tsx');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">Welcome!</span>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
