import subprocess
import sys
from pathlib import Path

REPO_DIR = Path(__file__).parent

def run(cmd, allow_fail=False):
    print(f"\n▶ {cmd}")
    result = subprocess.run(
        cmd,
        cwd=REPO_DIR,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(result.stderr.strip())

    if result.returncode != 0 and not allow_fail:
        print("\n❌ Command failed. Sync aborted.")
        pause_and_exit(1)

    return result.returncode

def pause_and_exit(code=0):
    input("\nPress ENTER to close...")
    sys.exit(code)

print("===================================")
print(" Git Commit & Sync (VS Code style)")
print("===================================")

# Ensure we're in a git repo
if not (REPO_DIR / ".git").exists():
    print("❌ This folder is not a Git repository.")
    pause_and_exit(1)

# Check status
print("\n🔍 Checking repository status...")
status = subprocess.run(
    "git status --porcelain",
    cwd=REPO_DIR,
    shell=True,
    text=True,
    stdout=subprocess.PIPE
).stdout.strip()

if status:
    print("📝 Changes detected. Committing...")
    run("git add .")
    run('git commit -m "update"', allow_fail=True)
else:
    print("✅ No local changes to commit.")

# Pull first (sync remote → local)
print("\n🔄 Syncing from remote (pull --rebase)...")
run("git pull --rebase")

# Push local commits
print("\n🚀 Pushing to remote...")
run("git push")

print("\n✅ Sync completed successfully.")
pause_and_exit(0)