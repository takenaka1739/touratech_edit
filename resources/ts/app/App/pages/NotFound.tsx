import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404ページ Component
 */
export const NotFound: React.VFC = () => (
  <>
    <div className="my-4">
      <h2 className="text-2xl">指定されたページはみつかりません。</h2>
      <div className="mt-6 text-blue-600 underline text-sm">
        <Link to={'/'}>TOPページへ戻る</Link>
      </div>
    </div>
  </>
);
