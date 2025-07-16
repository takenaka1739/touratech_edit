// resources/ts/app/TopImage/components/TopImageRow.tsx
import React from 'react';
import { TopImage } from '@/types/TopImage';

type Props = {
  item: TopImage;
  onToggleVisible: () => void;
  onDelete: () => void;
};

export const TopImageRow: React.FC<Props> = ({ item, onToggleVisible, onDelete }) => {
  return (
    <div className="flex items-center justify-between border px-4 py-2 rounded bg-white shadow-sm">
      <div className="flex-1">
        <div className="font-medium text-sm mb-1">画像ID: {item.image_id}</div>
        <div className="text-xs text-gray-500">リンク先: {item.url}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm">
          表示
          <button className="btn" onClick={onToggleVisible}>
            {item.is_enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <button className="btn btn-danger" onClick={onDelete}>
          削除
        </button>
      </div>
    </div>
  );
};
