export interface GitHubRepository {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    updatedAt: string;
    language: string | null;
    private: boolean;
}

const mockRepositories: GitHubRepository[] = [
    {
        id: 101,
        name: "web-ui",
        fullName: "acme-corp/web-ui",
        description: "Next.js frontend for the main platform",
        updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        language: "TypeScript",
        private: true,
    },
    {
        id: 102,
        name: "api-gateway",
        fullName: "acme-corp/api-gateway",
        description: "Go microservice for routing and auth",
        updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        language: "Go",
        private: true,
    },
    {
        id: 103,
        name: "docs",
        fullName: "acme-corp/docs",
        description: "Public documentation portal",
        updatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        language: "MDX",
        private: false,
    },
    {
        id: 104,
        name: "legacy-worker",
        fullName: "acme-corp/legacy-worker",
        description: null,
        updatedAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        language: "Python",
        private: true,
    },
];

export async function connectGitHub(): Promise<boolean> {
    // Simulate network latency for the OAuth popup flow
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app we'd save the token in localStorage or cookies
    if (typeof window !== 'undefined') {
        localStorage.setItem("codex_github_connected", "true");
    }

    return true;
}

export function isGitHubConnected(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem("codex_github_connected") === "true";
}

export function disconnectGitHub(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("codex_github_connected");
    }
}

export async function fetchRepositories(): Promise<GitHubRepository[]> {
    // Simulate network latency for API fetch
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockRepositories;
}
