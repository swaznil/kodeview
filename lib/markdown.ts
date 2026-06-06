// @ts-ignore - optional dependency; dev environment may not have types until install
import Prism from "prismjs";
// @ts-ignore
import "prismjs/components/prism-clike";
// @ts-ignore
import "prismjs/components/prism-javascript";
// @ts-ignore
import "prismjs/components/prism-typescript";
// @ts-ignore
import "prismjs/components/prism-jsx";
// @ts-ignore
import "prismjs/components/prism-tsx";
// @ts-ignore
import "prismjs/components/prism-python";
// @ts-ignore
import "prismjs/components/prism-css";
// @ts-ignore
import "prismjs/components/prism-markup";
// @ts-ignore
import "prismjs/components/prism-json";
// @ts-ignore
import "prismjs/components/prism-bash";
// @ts-ignore
import "prismjs/components/prism-java";
// @ts-ignore
import "prismjs/components/prism-c";
// @ts-ignore
import "prismjs/components/prism-cpp";
// @ts-ignore
import "prismjs/components/prism-csharp";
// @ts-ignore
import "prismjs/components/prism-go";
// @ts-ignore
import "prismjs/components/prism-rust";
// @ts-ignore
import "prismjs/components/prism-ruby";
// @ts-ignore
import "prismjs/components/prism-php";
// @ts-ignore
import "prismjs/components/prism-swift";
// @ts-ignore
import "prismjs/components/prism-kotlin";

const keywords = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "fn",
  "for",
  "from",
  "func",
  "function",
  "if",
  "import",
  "interface",
  "let",
  "new",
  "null",
  "return",
  "struct",
  "switch",
  "throw",
  "true",
  "try",
  "type",
  "undefined",
  "var",
  "while",
  "yield",
]);

function tokenizeLine(line: string) {
  return (
    line.match(
      /\s+|[A-Za-z_$][\w$-]*|\/\/.*|#(?!!).*|\*\/.*|\/\*.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\d+(?:\.\d+)?|[<][/A-Za-z][^>]*>|./g,
    ) ?? [""]
  );
}

export function highlightLine(
  line: string,
  extension: string | null,
  colors: {
    attr: string;
    comment: string;
    function: string;
    keyword: string;
    number: string;
    operator: string;
    punctuation: string;
    string: string;
    tag: string;
    text: string;
    variable: string;
  },
) {
  const ext = (extension ?? "")
    .toLowerCase()
    .replace(/^language-/, "")
    .replace(/^\./, "");

  // Map common file extensions to Prism language ids
  const extToPrism: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    css: "css",
    scss: "css",
    sass: "css",
    less: "css",
    html: "markup",
    htm: "markup",
    xml: "markup",
    svg: "markup",
    vue: "markup",
    json: "json",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    kts: "kotlin",
  };

  const prismLang = extToPrism[ext];

  // If Prism supports this language, use it for better tokenization.
  if (prismLang && (Prism.languages as any)[prismLang]) {
    const tokens = Prism.tokenize(line, (Prism.languages as any)[prismLang]);
    const out: { color: string; key: string; text: string }[] = [];

    function pushText(text: string, type?: string | null) {
      if (!text) return;
      const color =
        type && /comment/i.test(type)
          ? colors.comment
          : type && /tag|doctype|prolog|cdata/i.test(type)
            ? colors.tag
            : type && /attr-name|property|class-name|builtin/i.test(type)
              ? colors.attr
          : type && /string/i.test(type)
            ? colors.string
            : type && /number|boolean|constant|symbol/i.test(type)
              ? colors.number
              : type && /function|method/i.test(type)
                ? colors.function
              : type && /keyword|selector|important/i.test(type)
                ? colors.keyword
                : type && /operator/i.test(type)
                  ? colors.operator
                  : type && /punctuation/i.test(type)
                    ? colors.punctuation
                    : type && /variable|parameter/i.test(type)
                      ? colors.variable
                      : colors.text;
      out.push({ color, key: `${out.length}-${text}`, text });
    }

    function flattenToken(token: unknown, inheritedType: string | null = null) {
      if (typeof token === "string") {
        pushText(token, inheritedType);
        return;
      }

      if (Array.isArray(token)) {
        token.forEach((child) => flattenToken(child, inheritedType));
        return;
      }

      const prismToken = token as { content?: unknown; type?: string };
      const type = prismToken.type ?? inheritedType;
      flattenToken(prismToken.content ?? "", type);
    }

    for (const token of tokens) {
      flattenToken(token);
    }

    return out;
  }

  const pythonKeywords = new Set([
    "and",
    "as",
    "assert",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "False",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "None",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "True",
    "try",
    "while",
    "with",
    "yield",
  ]);

  const htmlExt = new Set(["html", "xml", "tsx", "jsx", "vue"]);
  const cssExt = new Set(["css", "scss", "sass", "less"]);
  const parts = tokenizeLine(line);
  const out: { color: string; key: string; text: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    let color = colors.text;

    // Comments
    if (/^(\/\/|#(?!!)|\/\*|\*\/)/.test(part)) {
      color = colors.comment;
      out.push({ color, key: `${i}-${part}`, text: part });
      continue;
    }

    // Strings
    if (/^["'`]/.test(part)) {
      color = colors.string;
      out.push({ color, key: `${i}-${part}`, text: part });
      continue;
    }

    // Numbers (with units)
    if (/^\d/.test(part) || /^#([0-9a-fA-F]{3,8})$/.test(part)) {
      color = colors.number;
      out.push({ color, key: `${i}-${part}`, text: part });
      continue;
    }

    // HTML / JSX tag names and attributes
    if (htmlExt.has(ext)) {
      // opening angle bracket or tag name like <div or </div
      if (
        /^<\/?[A-Za-z][\w:-]*/.test(part) ||
        /^>$/.test(part) ||
        /^<\/?>?$/.test(part)
      ) {
        color = colors.tag;
        out.push({ color, key: `${i}-${part}`, text: part });
        continue;
      }

      // attribute name (heuristic: token followed by '=' or next token is '=' )
      const next = parts[i + 1] ?? "";
      if (/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(part) && next === "=") {
        color = colors.keyword;
        out.push({ color, key: `${i}-${part}`, text: part });
        continue;
      }
    }

    // CSS heuristics: property names (token before ':'), hex colors, units handled above
    if (cssExt.has(ext)) {
      const next = parts[i + 1] ?? "";
      if (/^[A-Za-z-]+$/.test(part) && next === ":") {
        color = colors.keyword;
        out.push({ color, key: `${i}-${part}`, text: part });
        continue;
      }
    }

    // Python keywords
    if (ext === "py") {
      if (pythonKeywords.has(part)) {
        color = colors.keyword;
      }
      out.push({ color, key: `${i}-${part}`, text: part });
      continue;
    }

    // Default keywords (JS/TS/CS/etc)
    if (keywords.has(part)) {
      color = colors.keyword;
      out.push({ color, key: `${i}-${part}`, text: part });
      continue;
    }

    out.push({ color, key: `${i}-${part}`, text: part });
  }

  return out;
}

export function isMarkdownExtension(extension: string | null) {
  return extension === "md" || extension === "mdx" || extension === "markdown";
}

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language: string | null; lines: string[] }
  | { type: "rule" }
  | { type: "spacer" };

export function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  let inCode = false;
  let codeLanguage: string | null = null;
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({ type: "list", ordered: listOrdered, items: listItems });
    listItems = [];
  }

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", language: codeLanguage, lines: codeLines });
        codeLines = [];
        codeLanguage = null;
        inCode = false;
      } else {
        flushList();
        inCode = true;
        codeLanguage = trimmed.slice(3).trim() || null;
      }

      index += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!trimmed) {
      flushList();
      if (blocks.at(-1)?.type !== "spacer") {
        blocks.push({ type: "spacer" });
      }
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      if (listItems.length > 0 && listOrdered) {
        flushList();
      }
      listOrdered = false;
      listItems.push(bullet[1]);
      index += 1;
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (listItems.length > 0 && !listOrdered) {
        flushList();
      }
      listOrdered = true;
      listItems.push(ordered[1]);
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s?/, "") });
      index += 1;
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
    index += 1;
  }

  if (inCode) {
    blocks.push({ type: "code", language: codeLanguage, lines: codeLines });
  }

  flushList();
  return blocks;
}

export type InlineSegment = {
  text: string;
  bold?: boolean;
  code?: boolean;
  italic?: boolean;
  link?: string;
};

export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    const token = match[0];

    if (token.startsWith("**")) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith("*")) {
      segments.push({ text: token.slice(1, -1), italic: true });
    } else if (token.startsWith("`")) {
      segments.push({ text: token.slice(1, -1), code: true });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        segments.push({ text: linkMatch[1], link: linkMatch[2] });
      } else {
        segments.push({ text: token });
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}
