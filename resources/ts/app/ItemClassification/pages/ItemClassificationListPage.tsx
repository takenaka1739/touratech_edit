import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useItemClassificationListPage } from '../uses/useItemClassificationListPage';
import { useComposing } from '@/uses';

/**
 * 商品分類マスタ（一覧）画面 Component
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

  type FlatRow = Row & { level: 0 | 1; isParent: boolean };

  /** 親→子の順でフラット化（2階層想定） */
  const flatRows: FlatRow[] = useMemo(() => {
    const rows = (state?.rows ?? []) as Row[];

    const norm = (v: any) => (v === undefined || v === null ? '' : String(v));

    const parents = rows
      .filter(r => {
        const code = norm(r.code);
        const pc   = norm(r.parent_code);
        // 親判定：parent_code が空 or 自己参照
        return code && (pc === '' || pc === code);
      })
      .sort((a, b) => {
        const sa = a.sort_order ?? 0;
        const sb = b.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return norm(a.name).localeCompare(norm(b.name), 'ja');
      });

    const byParentCode = new Map<string, Row[]>();
    rows.forEach(r => {
      const code = norm(r.code);
      const pc   = norm(r.parent_code);
      // 子判定：親コードがあり、かつ親コード ≠ 自分のコード
      if (pc && pc !== code) {
        const list = byParentCode.get(pc) ?? [];
        list.push(r);
        byParentCode.set(pc, list);
      }
    });

    const result: FlatRow[] = [];
    const pushSortedChildren = (list?: Row[]) => {
      if (!list?.length) return;
      list
        .sort((a, b) => {
          const sa = a.sort_order ?? 0;
          const sb = b.sort_order ?? 0;
          if (sa !== sb) return sa - sb;
          return norm(a.name).localeCompare(norm(b.name), 'ja');
        })
        .forEach(c => result.push({ ...(c as Row), level: 1, isParent: false }));
    };

    parents.forEach(p => {
      result.push({ ...(p as Row), level: 0, isParent: true });
      const children = byParentCode.get(norm(p.code));
      pushSortedChildren(children);
      byParentCode.delete(norm(p.code));
    });

    // 親が見つからない孤立行も最後に表示（親扱い）
    byParentCode.forEach(list => {
      pushSortedChildren(list.map(c => ({ ...c, parent_code: '' })));
    });

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
      const isChild = r.level === 1;

      return (
        <tr key={r.id} style={isChild ? styles.childRow : undefined}>
          <td style={{ position: 'relative' }}>
            {/* 左ガイド（子だけ表示） */}
            {isChild && <span aria-hidden style={styles.childGuide} />}
            <div style={styles.nameCell}>
              <span style={styles.indent(isChild ? 24 : 4)} />
              {r.isParent ? (
                <span style={styles.iconParent}>P</span>
              ) : (
                <span style={styles.iconChild}>↳</span>
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
