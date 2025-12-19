export type CategoryLike = {
  id: number;
  code: string;
  name: string;
  parent_code?: string | null;
  sort_order?: number;  // 任意: 無ければ 0 補完
  is_display?: boolean;
  remarks?: string;
};

export type CategoryNode = CategoryLike & {
  code: string;         // 空は扱わない（無効データはスキップ）
  parent_code: string | null;
  sort_order: number;   // 確定（0 補完）
  children: CategoryNode[];
  level: number;
};

/** 兄弟の安定ソート */
const byOrderThenCode = (a: CategoryNode, b: CategoryNode) =>
  (a.sort_order - b.sort_order) || a.code.localeCompare(b.code);

/** 文字列の整形ヘルパー */
const norm = (v?: string | null) => {
  if (v === undefined || v === null) return '';
  return String(v).trim();
};

/**
 * フラット配列 → ツリー構造
 * ルート判定:
 *  - parent_code が空
 *  - parent_code === code（親=自分）
 *  - 親コードが存在しない（親未登録）
 */
export const buildCategoryTree = (rows: CategoryLike[]): CategoryNode[] => {
  const map = new Map<string, CategoryNode>();

  // 1) マップ化（無効な code はスキップ）
  rows.forEach(r => {
    const code = norm(r.code);
    if (!code) return; // 無効データは無視
    const node: CategoryNode = {
      ...r,
      code,
      parent_code: norm(r.parent_code) || null,
      sort_order: Number.isFinite(r.sort_order as number) ? (r.sort_order as number) : 0,
      children: [],
      level: 0,
    };
    map.set(code, node);
  });

  // 2) 親子付け
  const roots: CategoryNode[] = [];
  map.forEach(node => {
    const p = node.parent_code ? norm(node.parent_code) : '';
    const isRoot = !p || p === node.code || !map.has(p); //  ここがポイント

    if (isRoot) {
      node.level = 0;
      roots.push(node);
      return;
    }

    const parent = map.get(p)!;
    node.level = (parent.level ?? 0) + 1;
    parent.children.push(node);
  });

  // 3) 再帰ソート
  const sortRecursive = (list: CategoryNode[]) => {
    list.sort(byOrderThenCode);
    list.forEach(child => sortRecursive(child.children));
  };
  sortRecursive(roots);

  return roots;
};

/** ツリー → インデント情報付きにフラット化 */
export const flattenTree = (nodes: CategoryNode[], level = 0): CategoryNode[] => {
  let result: CategoryNode[] = [];
  nodes.forEach(n => {
    const self = { ...n, level };
    result.push(self);
    if (n.children && n.children.length > 0) {
      result = result.concat(flattenTree(n.children, level + 1));
    }
  });
  return result;
};
