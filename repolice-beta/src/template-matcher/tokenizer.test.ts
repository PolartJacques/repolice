import { describe, it, expect } from "vitest";
import { tokenizer } from "./tokenizer.js";

const FILE = `
function helloWorld() {
    doSomething();
    console.log('hello world');
}
`;

const FILE_TOKENS = [
  "function",
  "helloWorld",
  "(",
  ")",
  "{",
  "doSomething",
  "(",
  ")",
  ";",
  "console",
  ".",
  "log",
  "(",
  "'",
  "hello",
  "world",
  "'",
  ")",
  ";",
  "}",
];

const TEMPLATE = `
function [*]() {
    doSomething();
    [...]
}
`;

const TEMPLATE_TOKENS = [
  "function",
  "[*]",
  "(",
  ")",
  "{",
  "doSomething",
  "(",
  ")",
  ";",
  "[...]",
  "}",
];

describe("tokenizer", () => {
  describe(tokenizer.tokenizeFile.name, () => {
    it("should tokenize file", () => {
      const fileTokens = tokenizer.tokenizeFile(FILE);
      expect(fileTokens).toStrictEqual(FILE_TOKENS);
    });
  });

  describe(tokenizer.tokenizeTemplate.name, () => {
    it("should tokenize template", () => {
      const templateTokens = tokenizer.tokenizeTemplate(TEMPLATE);
      expect(templateTokens).toStrictEqual(TEMPLATE_TOKENS);
    });
  });
});
