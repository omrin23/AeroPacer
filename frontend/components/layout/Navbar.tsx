'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import Button from '../ui/Button';
import {
  HomeIcon,
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Debug logging to understand state issues
  console.log('Navbar render - user:', user);
  console.log('Navbar render - isAuthenticated:', isAuthenticated);
  console.log('Navbar render - user?.firstName:', user?.firstName);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏃‍♂️</span>
              <span className="text-xl font-bold text-foreground" style={{fontFamily:'var(--font-sora)'}}>AeroPacer</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-subtle">
              <Link href="#features" className="hover:text-foreground">Features</Link>
              <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="#insights" className="hover:text-foreground">Insights</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🏃‍♂️</span>
              <span className="text-xl font-bold text-foreground" style={{fontFamily:'var(--font-sora)'}}>AeroPacer</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-subtle hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-subtle">
              <span>Welcome back,</span>
              <span className="font-medium text-foreground">{user?.firstName}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;