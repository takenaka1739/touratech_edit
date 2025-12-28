import { useMemo } from 'react';

export type Row = {
  id: number | undefined;
  name: string | undefined;
  code?: string | null;
  parent_code?: string | null;
  is_display?: boolean | number | null;
  sort_order?: number | null;
};

export type FlatRow = Row & {
  level: number;
  isParent: boolean;
  hiddenByParent: boolean;
};

/**
 * 商品分類の階層構造をフラット化するカスタムフック
 */
export const useFlatItemClassification = (rows: Row[]) => {
  return useMemo<FlatRow[]>(() => {
    // ------------------------------
    // ① 正規化
    // ------------------------------
    const toHalfWidth = (str: string) =>
      str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
        String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
      );

    const norm = (v: any) => {
      if (v == null) return '';
      return toHalfWidth(String(v).trim());
    };

    // ------------------------------
    // ② childrenMap の構築
    // ------------------------------
    const buildChildrenMap = (rows: Row[]) => {
      const map = new Map<string, Row[]>();
      rows.forEach(r => {
        const pc = norm(r.parent_code);
        if (!map.has(pc)) map.set(pc, []);
        map.get(pc)!.push(r);
      });
      return map;
    };

    const childrenMap = buildChildrenMap(rows);

    // ------------------------------
    // ③ 比較関数（単一責務）
    // ------------------------------
    const compareRows = (a: Row, b: Row) => {
      const sa = a.sort_order ?? 0;
      const sb = b.sort_order ?? 0;
      if (sa !== sb) return sa - sb;

      return norm(a.name).localeCompare(norm(b.name), 'ja');
    };

    // ------------------------------
    // ④ 並び替え（比較関数に委譲）
    // ------------------------------
    const sortRows = (list: Row[]) => list.sort(compareRows);

    // ------------------------------
    // ⑤ 再帰フラット化
    // ------------------------------
    const result: FlatRow[] = [];

    const walk = (parentCode: string, level: number, parentHidden: boolean) => {
      const list = childrenMap.get(parentCode);
      if (!list) return;

      sortRows(list).forEach(r => {
        const code = norm(r.code);
        const pc = norm(r.parent_code);

        const isTopLevel = pc === code;
        const currentLevel = code === parentCode ? level : level + 1;

        const isDisplay = Number(r.is_display) === 1;
        const hiddenByParent = parentHidden || !isDisplay;

        result.push({
          ...(r as Row),
          level: currentLevel,
          isParent: isTopLevel,
          hiddenByParent,
        });

        if (code !== parentCode) {
          walk(code, currentLevel, hiddenByParent);
        }
      });
    };

    // ------------------------------
    // ⑥ 起点（トップ階層）の抽出
    // ------------------------------
    const topLevelCodes = rows
      .filter(r => norm(r.parent_code) === norm(r.code))
      .map(r => norm(r.code));

    // ------------------------------
    // ⑦ 実行
    // ------------------------------
    topLevelCodes.forEach(code => walk(code, 0, false));

    return result;
  }, [rows]);
};
