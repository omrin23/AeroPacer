'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { 
  ChartBarIcon, 
  CogIcon, 
  LinkIcon, 
  TrophyIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Debug auth state
  console.log('Page render - loading:', loading, 'isAuthenticated:', isAuthenticated);

  // Loading check for authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-soft mx-auto mb-4"></div>
          <p className="text-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(34,211,238,0.2),transparent_35%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" style={{fontFamily:'var(--font-sora)'}}>
              <span className="text-foreground">Revolutionize your training with </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-soft to-accent-teal">AeroPacer</span>
            </h1>

            <p className="text-lg md:text-xl text-subtle mb-10 max-w-3xl mx-auto">
              Personalized run plans, fatigue insights, and race predictions—powered by your data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </div>
          </div>
          {/* Preview cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card" hover>
              <Card.Content>
                <div className="text-subtle text-sm mb-2">AI Coaching</div>
                <div className="text-2xl font-semibold">Recovery Run • 40m Z2</div>
              </Card.Content>
            </Card>
            <Card className="card" hover>
              <Card.Content>
                <div className="text-subtle text-sm mb-2">10K Prediction</div>
                <div className="text-2xl font-semibold">45:30
                  <span className="ml-2 text-muted text-base">68% conf</span>
                </div>
              </Card.Content>
            </Card>
            <Card className="card" hover>
              <Card.Content>
                <div className="text-subtle text-sm mb-2">Weekly Distance</div>
                <div className="text-2xl font-semibold">18.4 km</div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{fontFamily:'var(--font-sora)'}}>Powerful features</h2>
            <p className="text-lg text-subtle max-w-2xl mx-auto">From adaptive plans to weather-aware insights, everything you need to level up.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white/5">
                  <LinkIcon className="h-6 w-6 text-primary-soft" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Strava Integration</h3>
                <p className="text-muted text-sm">Seamlessly connect to import activities and unlock deeper insights.</p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white/5">
                  <CogIcon className="h-6 w-6 text-accent-teal" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Coaching</h3>
                <p className="text-muted text-sm">Personalized training based on your performance and goals.</p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white/5">
                  <ChartBarIcon className="h-6 w-6 text-primary-soft" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted text-sm">Track performance trends, fatigue, recovery, and more.</p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white/5">
                  <TrophyIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Race Planning</h3>
                <p className="text-muted text-sm">Build pacing strategies and goals with model-driven predictions.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section id="pricing" className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl p-12 bg-gradient-to-r from-primary-soft/20 to-accent-teal/20 border border-border">
            <h2 className="text-3xl font-bold mb-3" style={{fontFamily:'var(--font-sora)'}}>Start your design journey today</h2>
            <p className="text-subtle mb-8">Experience AI-driven coaching without commitment.</p>
            <Link href="/register">
              <Button variant="primary" size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}