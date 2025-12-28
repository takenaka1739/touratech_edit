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
  level: number;              // 階層（0 = TOP）
  hiddenByParent: boolean;    // 親の表示設定による非表示の伝播
};

/**
 * 商品分類の階層構造をフラット化するカスタムフック。
 */
export const useFlatItemClassification = (rows: Row[]) => {
  return useMemo<FlatRow[]>(() => {
    // ------------------------------
    // 正規化
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
    // childrenMap の構築
    // ------------------------------
    const buildChildrenMap = (rows: Row[]) => {
      const map = new Map<string, Row[]>();

      rows.forEach(r => {
        const parent = norm(r.parent_code);
        const code = norm(r.code);

        const isTop = parent === '' || parent === code;

        if (isTop) {
          const key = ''; // TOP は空キーにまとめる
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(r);
          return;
        }

        const key = parent;

        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      });

      return map;
    };

    const childrenMap = buildChildrenMap(rows);

    // ------------------------------
    // 比較関数（単一責務）
    // ------------------------------
    const compareRows = (a: Row, b: Row) => {
      const sa = a.sort_order ?? 0;
      const sb = b.sort_order ?? 0;
      if (sa !== sb) return sa - sb;

      return norm(a.name).localeCompare(norm(b.name), 'ja');
    };

    const sortRows = (list: Row[]) => list.sort(compareRows);

    // ------------------------------
    // 再帰フラット化
    // ------------------------------
    const result: FlatRow[] = [];

    const walk = (parentCode: string, parentHidden: boolean, level = 0) => {
      const list = childrenMap.get(parentCode);
      if (!list) return;

      sortRows(list).forEach(r => {
        const code = r.code || '';

        const isDisplay = Number(r.is_display) === 1;
        const hiddenByParent = parentHidden || !isDisplay;

        result.push({
          ...(r as Row),
          level,
          hiddenByParent,
        });

        walk(code, hiddenByParent, level + 1);
      });
    };

    walk('', false, 0);

    return result;
  }, [rows]);
};
