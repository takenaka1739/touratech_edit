import { nl2br } from '@/utils/nl2br';

export const getMailConfirm = (text: string) => {
  const _text = nl2br(text);
  return (
    <div>
      <div>以下の内容でメールを送信しますがよろしいですか？</div>
      <div className="border border-gray-400 mt-4 p-2 text-sm">{_text}</div>
    </div>
  );
};
