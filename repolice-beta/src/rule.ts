import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import z from "zod";

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
export type Check = Rule["checks"][number];

const RULE_FILE_NAME = "rule.json";

export function loadRule(rulePath: string): Rule | undefined {
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
