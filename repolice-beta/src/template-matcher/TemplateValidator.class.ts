import { tokenizer } from "./tokenizer.js";

export interface ITemplateValidator {
  isTemplateValidated: boolean;
  feed: (token: string) => void;
}

export class TemplateValidator implements ITemplateValidator {
  ////////////////
  // PROPERTIES //
  ////////////////
  private tokens: string[] = [];
  private i = 0;
  private lastCheckpointIndex = 0;
  private template: string = "";
  public isTemplateValidated = false;

  /////////////////
  // CONSTRUCTOR //
  /////////////////
  public constructor(template: string) {
    this.template = template;
    this.tokens = tokenizer.tokenizeTemplate(this.template);
  }

  //////////////////////
  // PRIVATE METHODES //
  //////////////////////
  private get currentToken(): string | undefined {
    return this.tokens[this.i];
  }

  private doesTokenMatch = (fileToken: string): boolean =>
    fileToken === this.currentToken ||
    this.currentToken === tokenizer.ANY_TOKEN;

  private doesReachEndOfTemplate = (): boolean => this.i >= this.tokens.length;

  private validateToken(): void {
    this.i++;
    if (this.doesReachEndOfTemplate()) {
      this.isTemplateValidated = true;
    }
  }

  /////////////////////
  // PUBLIC METHODES //
  /////////////////////
  public feed(fileToken: string): void {
    if (this.isTemplateValidated) {
      return;
    }
    if (this.currentToken === tokenizer.ESCAPE_TOKEN) {
      this.validateToken();
      this.lastCheckpointIndex = this.i;
    }
    if (this.doesTokenMatch(fileToken)) {
      this.validateToken();
    } else if (this.i > this.lastCheckpointIndex) {
      this.i = this.lastCheckpointIndex;
      this.feed(fileToken);
    }
  }
}
