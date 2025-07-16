// resources/ts/app/TopImage/pages/TopImageListPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { PageWrapper, TableWrapper } from '@/components';
import { ImageSelectModal } from '../components/ImageSelectModal';
import { useTopImageListPage } from '../uses/useTopImageListPage';
import { TopImage } from '@/types/TopImage';

const TopImageListPage: React.FC = () => {
  const title = 'トップ画像マスタ';
  const slug = 'TopImage';

  const {
    slideItems,
    onToggleVisible,
    onDelete,
    fetchSlideItems,
  } = useTopImageListPage();

  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchSlideItems();
  }, []);

  // モーダルから登録完了後に呼ばれる関数
  const handleRegisterSuccess = () => {
    fetchSlideItems(); // 一覧を再取得
    setModalOpen(false);
  };

  const tables = useMemo(() => {
    return (
      <table>
        <thead>
          <tr>
            <th>画像ID</th>
            <th>リンク先URL</th>
            <th>表示</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {slideItems.map((item: TopImage) => (
            <tr key={item.id}>
              <td>{item.image_id}</td>
              <td>{item.url || '(未設定)'}</td>
              <td>
                <button
                  className="btn"
                  onClick={() => onToggleVisible(item.id)}
                >
                  {item.is_enabled ? '表示中' : '非表示'}
                </button>
              </td>
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => onDelete(item.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [slideItems]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="mb-2">
        <button className="btn" onClick={() => setModalOpen(true)}>
          画像を追加
        </button>
      </div>

      <TableWrapper
        isLoading={false}
        pager={undefined}
        onChangePage={() => {}}
      >
        {tables}
      </TableWrapper>

      <ImageSelectModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </PageWrapper>
  );
};

export default TopImageListPage;
