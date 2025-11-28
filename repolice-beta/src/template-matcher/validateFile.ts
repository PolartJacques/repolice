import {
  type ITemplateValidator,
  TemplateValidator,
} from "./TemplateValidator.class.js";
import { tokenizer } from "./tokenizer.js";

const templateIsValidated = (validator: ITemplateValidator): boolean =>
  validator.isTemplateValidated;

const feedToken =
  (token: string) =>
  (validator: ITemplateValidator): void =>
    validator.feed(token);

const feedValidators =
  (validators: ITemplateValidator[]) =>
  (token: string): void =>
    validators.forEach(feedToken(token));

const toTemplateValidator = (template: string): ITemplateValidator =>
  new TemplateValidator(template);

/**
 * assert that a file match given templates
 * @param file : the file to validate
 * @param templates : the templates to match
 * @returns true or false wether the file validate all template or not
 */
export function validateFile(file: string, templates: string[]): boolean {
  const validators = templates.map(toTemplateValidator);
  const fileTokens = tokenizer.tokenizeFile(file);

  fileTokens.forEach(feedValidators(validators));

  return validators.every(templateIsValidated);
}
