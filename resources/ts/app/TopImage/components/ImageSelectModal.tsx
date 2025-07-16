import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ImageItem = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void; // 登録成功後に一覧更新など行いたい場合
};

export const ImageSelectModal: React.FC<Props> = ({ open, onClose, onRegisterSuccess }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open) fetchImages();
  }, [open, page]);

  const fetchImages = async () => {
    try {
      const res = await axios.get('/api/images', {
        params: { search, page },
      });
      const imageData = res.data?.rows ?? [];
      setImages(imageData);
    } catch (err) {
      console.error('画像一覧取得に失敗', err);
      setImages([]);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchImages();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRegister = async (image: ImageItem) => {
    try {
      await axios.post('/api/TopImage', {
        image_id: image.id,
        url: '',
      });
      console.log('✅ スライド画像を登録しました');
      onClose();
      onRegisterSuccess?.(); // 一覧のリロードなどを呼ぶ用（任意）
    } catch (err) {
      console.error('❌ 登録に失敗', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">画像を選択</h2>
          <button className="btn btn-danger" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            className="input w-full"
            placeholder="画像名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn" onClick={handleSearch}>検索</button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="border p-2 rounded hover:bg-gray-50 flex flex-col items-center"
            >
              <img
                src={`/images/${img.name}`}
                alt={img.name}
                className="w-32 h-32 object-contain mb-2"
              />
              <div className="text-sm text-center break-all mb-2">{img.name}</div>
              <button className="btn btn-sm" onClick={() => handleRegister(img)}>追加</button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            前へ
          </button>
          <span className="text-sm">ページ: {page}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p + 1)}>
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};
