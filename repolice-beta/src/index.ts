import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

import { loadConfig } from "./repolice-config.js";
import chalk from "chalk";
import path from "node:path";

const execAsync = promisify(exec);

/**
 * try to clone a given git repository
 * @param gitUrl
 * @returns the repo path
 */
async function tryCloneRepoAscyn(gitUrl: string): Promise<string | undefined> {
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

type Error = { projectName: string; ruleName: string; issue: string };

//////////
// MAIN //
//////////

async function main() {
  const config = loadConfig();
  const errors: Error[] = [];

  for (const repo of config.repos) {
    const repoPath = await tryCloneRepoAscyn(repo.gitUrl);

    if (!repoPath) {
      console.log(chalk.yellow("Cannot run for curren repo, skip to next one"));
      continue;
    }

    for (const project of repo.projects) {
      const projectPath = path.join(repoPath, project.path);

      if (!fs.existsSync(projectPath)) {
        console.log(
          chalk.bgRed.black(
            ` project ${project.name} not found at path ${projectPath}`
          )
        );
        continue;
      }

      for (const ruleName of project.rules) {
        const rule = config.rules[ruleName];

        if (!rule) {
          console.log(
            chalk.bgYellow.black(
              ` definition of rule ${ruleName} for repo ${project.name} not found `
            )
          );
          continue;
        }

        for (const assertion of rule) {
          if (!fs.existsSync(path.join(repoPath, assertion.filePath))) {
            errors.push({
              projectName: project.name,
              ruleName,
              issue: `file ${assertion.filePath} not found`,
            });
          }
        }
      }
    }

    // delete repository at the end
    fs.rmSync(repoPath, { recursive: true, force: true });
  }

  if (errors.length > 0) {
    console.log(chalk.bgRed.white("\n\n === Error === \n"));
  } else {
    console.log(chalk.bgGreen.black("\n\n === Success === "));
  }
  errors.forEach((error) =>
    console.log(
      "❌",
      chalk.bgRed.white(`[${error.projectName}]`),
      chalk.gray(`(${error.ruleName})`),
      chalk.red(`${error.issue}`)
    )
  );
}

main();
