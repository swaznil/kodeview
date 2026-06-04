const keywords = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'def',
  'default',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'fn',
  'for',
  'from',
  'func',
  'function',
  'if',
  'import',
  'interface',
  'let',
  'new',
  'null',
  'return',
  'struct',
  'switch',
  'throw',
  'true',
  'try',
  'type',
  'undefined',
  'var',
  'while',
  'yield',
]);

function tokenizeLine(line: string) {
  return line.match(/\s+|[A-Za-z_$][\w$-]*|\/\/.*|#(?!!).*|\*\/.*|\/\*.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\d+(?:\.\d+)?|[<][/A-Za-z][^>]*>|./g) ?? [''];
}

export function highlightLine(
  line: string,
  extension: string | null,
  colors: { comment: string; keyword: string; number: string; string: string; tag: string; text: string }
) {
  return tokenizeLine(line).map((part, index) => {
    let color = colors.text;

    if (/^(\/\/|#(?!!)|\/\*|\*\/)/.test(part)) {
      color = colors.comment;
    } else if (/^["'`]/.test(part)) {
      color = colors.string;
    } else if (/^\d/.test(part)) {
      color = colors.number;
    } else if (/^<[^>]+>$/.test(part) && ['html', 'xml', 'tsx', 'jsx', 'vue'].includes(extension ?? '')) {
      color = colors.tag;
    } else if (keywords.has(part)) {
      color = colors.keyword;
    }

    return { color, key: `${index}-${part}`, text: part };
  });
}

export function isMarkdownExtension(extension: string | null) {
  return extension === 'md' || extension === 'mdx' || extension === 'markdown';
}

export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; language: string | null; lines: string[] }
  | { type: 'rule' }
  | { type: 'spacer' };

export function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
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

    blocks.push({ type: 'list', ordered: listOrdered, items: listItems });
    listItems = [];
  }

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', language: codeLanguage, lines: codeLines });
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
      if (blocks.at(-1)?.type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: 'rule' });
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

    if (trimmed.startsWith('>')) {
      flushList();
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s?/, '') });
      index += 1;
      continue;
    }

    flushList();
    blocks.push({ type: 'paragraph', text: trimmed });
    index += 1;
  }

  if (inCode) {
    blocks.push({ type: 'code', language: codeLanguage, lines: codeLines });
  }

  flushList();
  return blocks;
}

export type InlineSegment = { text: string; bold?: boolean; code?: boolean; italic?: boolean; link?: string };

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

    if (token.startsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('*')) {
      segments.push({ text: token.slice(1, -1), italic: true });
    } else if (token.startsWith('`')) {
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
