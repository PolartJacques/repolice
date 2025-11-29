import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import chalk from "chalk";
import fs from "node:fs";

const execAsync = promisify(exec);

/**
 * try to clone a given git repository
 * @param gitUrl
 * @returns the repo path
 */
export async function tryCloneRepoAscyn(
  gitUrl: string
): Promise<string | undefined> {
  try {
    const cmd = `git clone ${gitUrl}`;

    console.log(`🏗️ Cloning ${gitUrl}`);
    await execAsync(cmd);
    console.log("✔️ Clone completed.");
    const repoPath = path.join(process.cwd(), getRepoDirName(gitUrl));
    if (fs.existsSync(repoPath)) {
      return repoPath;
    } else {
      console.log(chalk.bgRed.black(` ${repoPath} not found `));
      return undefined;
    }
  } catch (err: unknown) {
    const reason =
      typeof err === "object" && err !== null && "message" in err
        ? err.message
        : err;
    console.log(chalk.bgRed.black(" Failed to clone repository: "));
    console.log(reason);
    return undefined;
  }
}

/**
 * get the directory name of a clone repo based on the git url
 * @param repoUrl
 * @returns
 */
function getRepoDirName(repoUrl: string): string {
  // Remove trailing slash if any
  const cleaned = repoUrl.replace(/\/+$/, "");
  // Extract the last path segment after "/" or ":"
  const lastPart = cleaned.split(/[/\:]/).pop()!;
  // Remove optional .git suffix
  return lastPart.replace(/\.git$/, "");
}
