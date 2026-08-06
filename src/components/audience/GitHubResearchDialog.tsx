import { useState } from "react";
import { toast } from "sonner";
import { Github, Search, Star, GitFork, Loader2, Plus, X, Users } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  owner?: { login?: string; avatar_url?: string };
  updated_at?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (v: { username: string; platform: string; notes?: string; displayName?: string }) => void;
}

const SEARCH_SUGGESTIONS = ["social media", "scheduler", "marketing", "content", "analytics"];

export function GitHubResearchDialog({ open, onOpenChange, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setRepos([]);
    setSearched(true);
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(term)}&sort=stars&order=desc&per_page=12`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      setRepos((data.items ?? []) as GitHubRepo[]);
      if (!(data.items ?? []).length) toast.info("No repositories matched that search.");
    } catch (e) {
      toast.error(`GitHub search failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const trackRepo = async (repo: GitHubRepo) => {
    onAdd({
      username: repo.full_name,
      platform: "GitHub",
      notes: repo.description?.slice(0, 120) ?? undefined,
      displayName: repo.full_name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" /> Research competitors on GitHub
          </DialogTitle>
          <DialogDescription>
            Search public GitHub repositories — stars, forks, language and activity — then track one as a GitHub competitor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search repos, e.g. 'scheduler' or 'Acme Corp'"
              className="flex-1"
            />
            <Button onClick={() => search()} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuery(s); search(s); }}
                className="px-2.5 h-7 rounded-full border border-border/60 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching GitHub…
            </div>
          )}

          {!loading && repos.length > 0 && (
            <div className="space-y-2">
              {repos.map((repo) => (
                <div key={repo.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-foreground hover:underline truncate inline-flex items-center gap-1.5"
                      >
                        <Github className="h-3.5 w-3.5 text-muted-foreground" /> {repo.full_name}
                      </a>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{repo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-muted-foreground">
                        {repo.language && <Badge variant="secondary" className="text-[10px]">{repo.language}</Badge>}
                        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stargazers_count.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" /> {repo.forks_count.toLocaleString()}</span>
                        {repo.owner?.login && (
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {repo.owner.login}</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => trackRepo(repo)}>
                      <Plus className="h-3.5 w-3.5" /> Track
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searched && repos.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No repos found. Try a different query or add manually.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
