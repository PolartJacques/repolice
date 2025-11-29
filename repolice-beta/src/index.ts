import fs from "node:fs";
import { readFile } from "node:fs/promises";
import { loadConfig } from "./repolice-config.js";
import chalk from "chalk";
import path from "node:path";
import { doesFileMatchTemplates } from "./template-matcher/validateFile.js";
import { tryCloneRepoAscyn } from "./github.js";
import { loadRule } from "./rule.js";

type Error = { projectName: string; ruleName: string; issue: string };

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
        const onError = (issue: string) => {
          errors.push({
            projectName: project.name,
            ruleName,
            issue,
          });
        };
        const rulePath = path.join(process.cwd(), "rules", ruleName);
        const rule = loadRule(rulePath);

        if (!rule) {
          onError(`definition of rule not found at ${rulePath}`);
          continue;
        }

        for (const check of rule.checks) {
          const filePath = path.join(projectPath, check.filePath);
          if (!fs.existsSync(filePath)) {
            onError(`file "${check.filePath}" not found in project`);
            continue;
          }

          if (check.template) {
            const templateFile = await readFile(
              path.join(rulePath, check.template),
              "utf-8"
            );
            const templates = templateFile.split("---");
            const file = fs.readFileSync(filePath, "utf8");
            if (!doesFileMatchTemplates(file, templates)) {
              onError("file does not match templates");
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
