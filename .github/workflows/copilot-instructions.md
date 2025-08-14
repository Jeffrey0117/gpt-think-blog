# Copilot Guardrails (repo-scoped)

## 0) When to ask / not ask

- Do NOT ask for confirmation for routine edits or commands.
- ALWAYS ask for explicit confirmation only if an action deletes, renames, or moves files, or performs irreversible data migrations.
- If uncertain whether a change is destructive, ask once with a clear summary and a "safe alternative".

## 1) Shell command policy

- For any command, always print the current directory first and then run the command in that same directory.
- Default POSIX form:
  `echo "cwd: $(pwd)"; npm --prefix "$(pwd)" run dev`
- If multiple commands are needed, chain with `;` (not `&&`) unless the user explicitly asks for short-circuit behavior.
- When suggesting commands, include a Windows PowerShell variant:
  `Write-Host "cwd: $PWD"; npm --prefix "$PWD" run dev`
- Never change the terminal working directory implicitly; do not suggest `cd some/dir` unless the user asked.

## 2) Running dev servers

- When I say "npm run dev", suggest both:
  - POSIX: `echo "cwd: $(pwd)"; npm --prefix "$(pwd)" run dev`
  - PowerShell: `Write-Host "cwd: $PWD"; npm --prefix "$PWD" run dev`
- Do not alter ports or auto-open browsers unless explicitly instructed.
- If the project has a `scripts/dev.sh` or `scripts/dev.ps1`, prefer calling it and keep the same cwd-printing behavior.

## 3) Safety & scope

- Prefer non-destructive edits; propose new files/patches instead of in-place risky refactors.
- Do not add or remove dependencies unless requested; if adding is necessary, justify and check existing utils first.
- Respect package manager & Node settings (.nvmrc/.node-version, npm/pnpm/yarn). Do not switch managers.
- Never modify `package.json` scripts without permission.

## 4) Output format for any change

- Provide: (1) a brief plan, (2) diffs or new file contents, (3) exact commands to run, (4) rollback steps.

## 5) Project conventions (customize freely)

- TypeScript strict, ESLint + Prettier on save.
- For Next.js: App Router, Server Components by default; no client component unless necessary.
