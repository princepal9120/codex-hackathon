'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Github, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { createProject } from '@/components/project-api';
import { Button } from '@/components/ui/Button';

const STEPS = [
  { label: 'Connect GitHub' },
  { label: 'Import Project' },
  { label: 'Get Started' },
];

const MOCK_REPOS = [
  { full_name: 'acmecorp/web-frontend', desc: 'NextJS React frontend application' },
  { full_name: 'acmecorp/api-gateway', desc: 'Go microservice aggregation layer' },
  { full_name: 'prince/codex-hackathon', desc: 'Hackathon repo for CodexFlow' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setLoading(true);
    // Simulate OAuth redirect latency
    setTimeout(() => {
      setLoading(false);
      setStep(1);
    }, 1200);
  };

  const handleImport = async (repo: typeof MOCK_REPOS[0]) => {
    setLoading(true);
    setError(null);
    try {
      await createProject({
        name: repo.full_name,
        description: repo.desc,
        repoPath: '.',
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.push('/board?from=onboarding');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Landing</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">CF</div>
            <span className="text-sm font-semibold text-foreground">CodexFlow Onboarding</span>
          </div>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Setup your project</h1>
              <p className="mt-2 text-muted-foreground">Follow these steps to connect your repository and start using CodexFlow.</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-12 flex items-center justify-center gap-4">
              {STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${i <= step
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {i < step ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold ${i <= step ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-1 w-16 mb-6 rounded-full transition-colors duration-500 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Views */}
            <div className="min-h-[300px] flex flex-col items-center justify-center">
              {step === 0 && (
                <div className="fade-in flex flex-col items-center space-y-6 text-center">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <Github className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Authenticate with GitHub</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                      CodexFlow needs access to scan files, commit changes, and trigger workflows on your repository. We only request minimum scopes.
                    </p>
                  </div>
                  <Button onClick={handleConnect} disabled={loading} size="lg" className="h-12 px-8 gap-2 font-semibold shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Github className="h-5 w-5" />}
                    {loading ? 'Authenticating...' : 'Connect to GitHub'}
                  </Button>
                </div>
              )}

              {step === 1 && (
                <div className="fade-in w-full space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">Select a repository</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Choose which project you want to onboard.
                    </p>
                  </div>

                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {MOCK_REPOS.map((repo) => (
                      <button
                        key={repo.full_name}
                        onClick={() => handleImport(repo)}
                        disabled={loading}
                        className="group flex w-full flex-col items-start rounded-xl border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{repo.full_name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1 rounded bg-muted/50">GitHub</span>
                        </div>
                        <span className="text-sm text-muted-foreground mt-1 line-clamp-1">{repo.desc}</span>
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                      {error}
                    </div>
                  )}

                  {loading && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground font-medium animate-pulse">Setting up your workspace...</p>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="fade-in flex flex-col items-center space-y-6 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                    <div className="relative p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Ready for action!</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                      Your project <strong>{MOCK_REPOS[2].full_name}</strong> is connected. You can now start creating tasks and executing them on our sandbox.
                    </p>
                  </div>
                  <Button onClick={handleDone} size="lg" className="h-12 px-10 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                    Go to Kanban Board
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/30 border-t border-border p-6 flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-medium italic">
              Step {step + 1} of {STEPS.length}
            </p>
            {step < 2 && (
              <p className="text-xs text-muted-foreground">
                Need help? <a href="#" className="underline font-semibold text-primary">Read docs</a>
              </p>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
