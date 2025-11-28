const ESCAPE_TOKEN = '[...]';
const ANY_TOKEN = '[*]';
const tokens = [ESCAPE_TOKEN, ANY_TOKEN] as const;

const escapeRegex = (x: string): string => x.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const fileRegex = /\w+|[^\s\w]/g;
const templateRegex = new RegExp(`${tokens.map(escapeRegex).join('|')}|${fileRegex.source}`, 'g');

const tokenize =
  (regex: RegExp) =>
  (text: string): string[] => {
    return text.match(regex)?.filter((token) => !['\n', ' '].includes(token)) ?? [];
  };

const tokenizeFile = tokenize(fileRegex);
const tokenizeTemplate = tokenize(templateRegex);

export const tokenizer = {
  ANY_TOKEN,
  ESCAPE_TOKEN,
  tokenizeFile,
  tokenizeTemplate,
};
