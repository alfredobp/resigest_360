'use client';

import React from 'react';

/**
 * Renderizador seguro y ligero de Markdown para respuestas del asistente legal.
 * Soporta párrafos, listas con viñetas (incluyendo subniveles), listas numeradas,
 * negritas (**texto**), cursivas (*texto*) y código en línea (`código`),
 * sin usar dangerouslySetInnerHTML.
 */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b-${keyIndex++}`} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`c-${keyIndex++}`}
          className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[11px] text-slate-900 dark:bg-slate-700 dark:text-slate-100"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`i-${keyIndex++}`} className="italic text-slate-600 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

interface ParsedBlock {
  type: 'paragraph' | 'list';
  ordered?: boolean;
  lines?: string[];
  items?: Array<{ text: string; indent: number }>;
}

function parseBlocks(content: string): ParsedBlock[] {
  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ParsedBlock[] = [];

  let currentParagraph: string[] = [];
  let currentList: { ordered: boolean; items: Array<{ text: string; indent: number }> } | null = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', lines: currentParagraph });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push({ type: 'list', ordered: currentList.ordered, items: currentList.items });
      currentList = null;
    }
  };

  for (const rawLine of rawLines) {
    if (rawLine.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = /^(\s*)(?:[*-]|•)\s+(.*)$/.exec(rawLine);
    const orderedMatch = /^(\s*)\d+\.\s+(.*)$/.exec(rawLine);

    if (unorderedMatch) {
      flushParagraph();
      const indent = unorderedMatch[1].length >= 2 ? 1 : 0;
      const text = unorderedMatch[2].trim();
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push({ text, indent });
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      const indent = orderedMatch[1].length >= 2 ? 1 : 0;
      const text = orderedMatch[2].trim();
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push({ text, indent });
      continue;
    }

    flushList();
    currentParagraph.push(rawLine.trim());
  }

  flushParagraph();
  flushList();

  return blocks;
}

export default function LegalMarkdownContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIdx) => {
        if (block.type === 'list' && block.items) {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={`list-${blockIdx}`}
              className={`space-y-1.5 pl-4 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              } marker:text-emerald-600 dark:marker:text-emerald-400`}
            >
              {block.items.map((item, itemIdx) => (
                <li
                  key={`item-${blockIdx}-${itemIdx}`}
                  className={item.indent > 0 ? 'ml-4 list-[circle] marker:text-slate-400' : ''}
                >
                  {renderInline(item.text)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={`p-${blockIdx}`} className="leading-relaxed">
            {(block.lines ?? []).map((line, lineIdx) => (
              <React.Fragment key={`l-${blockIdx}-${lineIdx}`}>
                {lineIdx > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
