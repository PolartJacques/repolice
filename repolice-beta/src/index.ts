import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { readFile } from "node:fs/promises";

import { loadConfig } from "./repolice-config.js";
import chalk from "chalk";
import path from "node:path";
import { validateFile } from "./template-matcher/validateFile.js";
import z from "zod";

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

const ruleShema = z.object({
  name: z.string(),
  checks: z.array(
    z.object({
      filePath: z.string(),
      template: z.string().optional(),
    })
  ),
});

type Rule = z.infer<typeof ruleShema>;

const RULE_FILE_NAME = "rule.json";

function loadRule(rulePath: string): Rule | undefined {
  const ruleFilePath = path.join(rulePath, RULE_FILE_NAME);
  if (!fs.existsSync(ruleFilePath)) {
    console.log(
      chalk.bgRed.black(` ${RULE_FILE_NAME} NOT FOUND IN ${process.cwd()} `)
    );
    return undefined;
  }

  const raw = fs.readFileSync(ruleFilePath, "utf8");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    console.log(chalk.bgRed.black(` INVALID JSON FORMAT IN ${ruleFilePath} `));
    return undefined;
  }

  // Validate against schema
  const parsed = ruleShema.safeParse(json);
  if (!parsed.success) {
    console.log(chalk.bgRed.black(" INVALID CONFIG "));
    parsed.error.issues.forEach((issue) => {
      const path = issue.path.join(".") || "(root)";
      console.log(`• ${path} => ${issue.message}`);
    });
    return undefined;
  }

  return parsed.data;
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
        const rulePath = path.join(process.cwd(), "rules", ruleName);
        const rule = loadRule(rulePath);

        if (!rule) {
          errors.push({
            projectName: project.name,
            ruleName,
            issue: `definition of rule not found at ${rulePath}`,
          });
          continue;
        }

        for (const check of rule.checks) {
          const filePath = path.join(projectPath, check.filePath);
          if (!fs.existsSync(filePath)) {
            errors.push({
              projectName: project.name,
              ruleName,
              issue: `file "${check.filePath}" not found in project`,
            });
            continue;
          }

          if (check.template) {
            const templateFile = await readFile(
              path.join(rulePath, check.template),
              "utf-8"
            );
            const templates = templateFile.split("---");
            const file = fs.readFileSync(filePath, "utf8");
            if (!validateFile(file, templates)) {
              errors.push({
                projectName: project.name,
                ruleName,
                issue: "templates not matched",
              });
            }
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
