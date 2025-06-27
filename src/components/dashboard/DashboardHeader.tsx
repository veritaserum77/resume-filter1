'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { getUserProfile } from '@/lib/api'; // <-- ✅ import your API function

export function DashboardHeader() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }

    // ✅ Fetch user profile
    const fetchProfile = async () => {
      try {
        const user = await getUserProfile(token);
        setName(user.name || 'User');
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setName('User');
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {/* ✅ Show Welcome message with name */}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome{ name ? `, ${name}` : '' }!
          </span>
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
