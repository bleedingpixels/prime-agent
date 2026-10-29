/**
 * Parsed git URL information.
 */
export type GitSource = {
    /** Always "git" for git sources */
    type: "git";
    /** Clone URL (always valid for git clone, without ref suffix) */
    repo: string;
    /** Git host domain (e.g., "github.com") */
    host: string;
    /** Repository path (e.g., "user/repo") */
    path: string;
    /** Git ref (branch, tag, commit) if specified */
    ref?: string;
    /** True if ref was specified (package won't be auto-updated) */
    pinned: boolean;
};
/**
 * Parse git source into a GitSource.
 *
 * Rules:
 * - With git: prefix, accept all historical shorthand forms.
 * - Without git: prefix, only accept explicit protocol URLs.
 */
export declare function parseGitUrl(source: string): GitSource | null;
export type GitPaths = {
    repoDir: string;
    commonGitDir: string;
    headPath: string;
};
/**
 * Find git metadata paths by walking up from cwd.
 * Handles both regular git repos (.git is a directory) and worktrees (.git is a file).
 */
export declare function findGitPaths(cwd: string): GitPaths | null;
export interface GitContext {
    repoUrl?: string;
    commit?: string;
    branch?: string;
}
export declare function gitContextsEqual(a: GitContext, b: GitContext): boolean;
export declare function captureGitContext(cwd: string): GitContext | null;
//# sourceMappingURL=git.d.ts.map