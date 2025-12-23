import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useItemClassificationListPage } from '../uses/useItemClassificationListPage';
import { useComposing } from '@/uses';

/**
 * 商品分類マスタ一覧ページ
 */
export const ItemClassificationListPage: React.VFC = () => {
  const title = '商品分類マスタ';
  const slug = 'item_classification';

  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = useItemClassificationListPage(slug);

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  type Row = {
    id: number;
    name: string;
    code?: string | null;
    parent_code?: string | null;
    is_display?: boolean | number | null;
    sort_order?: number | null;
  };

  type FlatRow = Row & { level: number; isParent: boolean };

  // 親から子の順でフラット化（多層構造）
  const flatRows: FlatRow[] = useMemo(() => {
    const rows = (state?.rows ?? []) as Row[];

    const toHalfWidth = (str: string) =>
      str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
        String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
      );

    const norm = (v: any) => {
      if (v === undefined || v === null) return '';
      const s = String(v).trim();
      return toHalfWidth(s);
    };

    // Map: parent_code → children
    const childrenMap = new Map<string, Row[]>();
    rows.forEach(r => {
      const code = norm(r.code);
      const pc = norm(r.parent_code);

      if (!childrenMap.has(pc)) childrenMap.set(pc, []);
      childrenMap.get(pc)!.push(r);
    });

    // 並び替え
    const sortRows = (list: Row[]) =>
      list.sort((a, b) => {
        const sa = a.sort_order ?? 0;
        const sb = b.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return norm(a.name).localeCompare(norm(b.name), 'ja');
    });
      
    const result: FlatRow[] = [];

    // 再帰フラット化
    const walk = (parentCode: string, level: number) => {

      const list = childrenMap.get(parentCode);
      if (!list) return;
      
      sortRows(list).forEach(r => {
        const code = norm(r.code);
        const pc = norm(r.parent_code);

        const isTopLevel = pc === code;
        const currentLevel = code === parentCode ? level : level + 1;

        result.push({
          ...(r as Row),
          level: currentLevel,
          isParent: isTopLevel,   // TOP階層のみ親扱い
        });
        
        if (code !== parentCode) {
          walk(code, currentLevel);
        }
      });
    };

    const topLevelCodes = rows
      .filter(r => norm(r.parent_code) === norm(r.code))
      .map(r => norm(r.code));
    
    // 最上位カテゴリから再帰開始
    topLevelCodes.forEach(code => walk(code, 0));
    
    return result;
  }, [state.rows]);

  // ちょいリッチに見せるための軽いスタイル（コード/表示のバッジは削除）
  const styles = {
    nameCell: { display: 'flex', alignItems: 'center' } as React.CSSProperties,
    indent: (px: number) => ({ width: px, minWidth: px }) as React.CSSProperties,
    iconParent: {
      display: 'inline-block',
      width: 18, height: 18, lineHeight: '18px',
      textAlign: 'center',
      borderRadius: 4,
      background: '#eef2ff', color: '#3730a3', // indigo
      fontWeight: 700, fontSize: 12, marginRight: 8,
    } as React.CSSProperties,
    iconChild: {
      color: '#6b7280', // gray-500
      marginRight: 8, fontSize: 14,
    } as React.CSSProperties,
    childRow: { background: '#fafafa' } as React.CSSProperties,
    childGuide: {
      borderLeft: '3px solid #e5e7eb', // gray-200
      height: '100%',
      position: 'absolute',
      left: 8, top: 0,
    } as React.CSSProperties,
  };

  const tables = useMemo(() => {
    const tbody = flatRows.map(r => {
      const isDisplay = Number(r.is_display) === 1;
      const isChild = r.level >= 1;

      return (
        <tr key={r.id} style={isChild ? styles.childRow : undefined}>
          <td style={{ position: 'relative' }}>
            {/* 左ガイド（子だけ表示） */}
            {isChild && <span aria-hidden style={styles.childGuide} />}
            <div style={styles.nameCell}>
              <span style={styles.indent(20 * r.level)} />
              {r.isParent ? (
                <span style={styles.iconParent}>P</span>
              ) : (
                <span style={styles.iconChild}>{'↳'.repeat(r.level)}</span>
              )}
              <span style={{ fontWeight: r.isParent ? 700 : 500 }}>{r.name}</span>
            </div>
          </td>
          {/* ← ここをシンプル表示に戻す */}
          <td>{r.code ?? ''}</td>
          <td>{isDisplay ? '表示' : '非表示'}</td>
          <td className="col-btn">
            <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th>商品分類名</th>
            <th>分類コード</th>
            <th>表示</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [flatRows]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composing) onClickSearchButton();
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>

      <div className="mt-2">
        <button className="btn" onClick={addDetail}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};
