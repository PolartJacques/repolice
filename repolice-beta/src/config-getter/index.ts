// import z from "zod";
// import { readFileSync } from "fs";
// import { resolve } from "path";

// const repoSchema = z.object({
//   git: z.string(),
//   rules: z.array(z.string()),
// });

// const configSchema = z.object({
//   repos: z.array(repoSchema),
// });

// type Config = z.infer<typeof configSchema>;

// function loadConfig(): Config {
//   const absolutePath = resolve(process.cwd(), configPath);

//   let fileContent: string;
//   try {
//     fileContent = readFileSync(absolutePath, "utf-8");
//   } catch (err) {
//     throw new Error(`Could not read config file at: ${absolutePath}`);
//   }

//   let jsonData: unknown;
//   try {
//     jsonData = JSON.parse(fileContent);
//   } catch (err) {
//     throw new Error(`Invalid JSON format in config file: ${absolutePath}`);
//   }

//   const result = ConfigSchema.safeParse(jsonData);

//   if (!result.success) {
//     throw new Error(
//       "Config validation failed:\n" +
//         JSON.stringify(result.error.format(), null, 2)
//     );
//   }

//   return result.data;
// }
