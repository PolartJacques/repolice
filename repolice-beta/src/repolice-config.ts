import chalk from "chalk";
import fs from "fs";
import z from "zod";

const CONFIG_PATH = "repolice.config.json";

const projectShema = z.object({
  name: z.string(),
  path: z.string(),
  rules: z.array(z.string()),
});

const repoShema = z.object({
  gitUrl: z.string(),
  projects: z.array(projectShema),
});

const assertionShema = z.object({
  filePath: z.string(),
  templates: z.array(z.string()).optional(),
});

const configShema = z.object({
  repos: z.array(repoShema),
  rules: z.record(z.string(), z.array(assertionShema)),
});

type Config = z.infer<typeof configShema>;

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(
      chalk.bgRed.black(` ${CONFIG_PATH} NOT FOUND IN ${process.cwd()} `)
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf8");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    console.log(chalk.bgRed.black(` INVALID JSON FORMAT IN ${CONFIG_PATH} `));
    process.exit(1);
  }

  // Validate against schema
  const parsed = configShema.safeParse(json);
  if (!parsed.success) {
    console.log(chalk.bgRed.black(" INVALID CONFIG "));
    parsed.error.issues.forEach((issue) => {
      const path = issue.path.join(".") || "(root)";
      console.log(`• ${path} => ${issue.message}`);
    });
    process.exit(1);
  }

  return parsed.data;
}
