import { describe, it, expect } from "vitest";
import { doesFileMatchTemplates } from "./validateFile.js";

const FILE = `
import { doSomething } from '@myModule';

function helloWorld() {
    doSomething();
    console.log('hello world');
}

export helloWorld;
`;

const FILE_WITH_DIFFERENT_FORMATING = `
import {doSomething} from '@myModule';
function helloWorld()
{
    doSomething();

    console.log('hello world');
}
export helloWorld;
`;

const PATIAL_TEMPLATE = `
function helloWorld() {
    doSomething();
    console.log('hello world');
}
`;

const TEMPLATE_WITH_ELISPE = `
function helloWorld() {
    [...]
}
`;

const TEMPLATE_WITH_ANY_TOKEN = `
function [*]() {
    doSomething();
    console.log('hello world');
}
`;

const NON_MATCHING_TEMPLATE = `
function helloWorld() {
    WrongFunction();
    console.log('hello world');
}`;

const COMPLETE_TEMPLATE = `
function [*] ()
{
    [...]
    doSomething();
    [...]
}
`;

describe(doesFileMatchTemplates.name, () => {
  it.concurrent("should be be insensitive to format", () => {
    const isValid = doesFileMatchTemplates(FILE, [
      FILE_WITH_DIFFERENT_FORMATING,
    ]);
    expect(isValid).toBeTruthy();
  });

  it.concurrent("should ignore the before and after template", () => {
    const isValid = doesFileMatchTemplates(FILE, [PATIAL_TEMPLATE]);
    expect(isValid).toBeTruthy();
  });

  it.concurrent("should handle elipse in template via the espace token", () => {
    const isValid = doesFileMatchTemplates(FILE, [TEMPLATE_WITH_ELISPE]);
    expect(isValid).toBeTruthy();
  });

  it.concurrent('should handle the "any" token', () => {
    const isValid = doesFileMatchTemplates(FILE, [TEMPLATE_WITH_ANY_TOKEN]);
    expect(isValid).toBeTruthy();
  });

  it.concurrent("should validate file with many templates", () => {
    const isValid = doesFileMatchTemplates(FILE, [
      FILE_WITH_DIFFERENT_FORMATING,
      PATIAL_TEMPLATE,
      TEMPLATE_WITH_ELISPE,
      TEMPLATE_WITH_ANY_TOKEN,
    ]);
    expect(isValid).toBeTruthy();
  });

  it.concurrent(
    "should not validate file if one template or more is invalid",
    () => {
      const isValid = doesFileMatchTemplates(FILE, [NON_MATCHING_TEMPLATE]);
      expect(isValid).toBeFalsy();
    }
  );

  it.concurrent("should validate file on a realistic exemple", () => {
    const isValid = doesFileMatchTemplates(FILE, [COMPLETE_TEMPLATE]);
    expect(isValid).toBeTruthy();
  });
});
