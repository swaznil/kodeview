import type { RepositoryTreeNode } from '@/lib/repository-storage';

export type VisibleTreeRow = {
  depth: number;
  key: string;
  node: RepositoryTreeNode;
};

export function filterTree(nodes: RepositoryTreeNode[], query: string): RepositoryTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  return nodes
    .map((node) => {
      if (node.name.toLowerCase().includes(normalized) || node.path.toLowerCase().includes(normalized)) {
        return node;
      }

      if (node.type === 'directory' && node.children) {
        const children = filterTree(node.children, normalized);
        if (children.length > 0) {
          return { ...node, children };
        }
      }

      return null;
    })
    .filter((node): node is RepositoryTreeNode => Boolean(node));
}

export function flattenVisibleTree(
  nodes: RepositoryTreeNode[],
  expanded: Set<string>,
  depth = 0
): VisibleTreeRow[] {
  const rows: VisibleTreeRow[] = [];

  for (const node of nodes) {
    rows.push({ depth, key: node.path, node });

    if (node.type === 'directory' && expanded.has(node.path) && node.children?.length) {
      rows.push(...flattenVisibleTree(node.children, expanded, depth + 1));
    }
  }

  return rows;
}

export function collectDirectoryPaths(nodes: RepositoryTreeNode[], limit = 6): string[] {
  const paths: string[] = [];

  function visit(items: RepositoryTreeNode[]) {
    for (const node of items) {
      if (paths.length >= limit) {
        return;
      }

      if (node.type === 'directory') {
        paths.push(node.path);
        visit(node.children ?? []);
      }
    }
  }

  visit(nodes);
  return paths;
}

export function findReadme(nodes: RepositoryTreeNode[]): RepositoryTreeNode | null {
  for (const node of nodes) {
    if (node.type === 'file' && /^readme(\.(md|mdx|markdown))?$/i.test(node.name)) {
      return node;
    }
  }

  return null;
}
