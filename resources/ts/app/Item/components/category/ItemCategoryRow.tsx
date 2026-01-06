import { Category } from '@/app/Item/modules/types/Category';

type Props = {
  item: Category & { originalIndex: number };
  isDuplicate: boolean;
  onChangeCategory: (index: number) => void;
  onDeleteCategory: (index: number) => void;
  showDelete: boolean;
};

export const ItemCategoryRow = ({
  item,
  isDuplicate,
  onChangeCategory,
  onDeleteCategory,
  showDelete,
}: Props) => {
  const borderColor = isDuplicate ? "red" : "#BCC7D4";

  return (
    <div>
      <div style={{ display: "flex" }}>
        <input
          className="vari-row-input"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: "#EDF2F7",
            marginTop: "5px",
            width: "512px",
          }}
          value={item.name}
          readOnly            // ダイアログで選択するため直接編集不可
        />

        <button
          className="btn py-0 px-2"
          style={{ marginTop: "5px", marginLeft: "8px" }}
          onClick={() => onChangeCategory(item.originalIndex)}
        >
          ...
        </button>

        {showDelete && (
          <button
            className="btn-delete"
            style={{ marginTop: "5px", marginLeft: "5px", whiteSpace: "nowrap" }}
            onClick={() => onDeleteCategory(item.originalIndex)}
          >
            削除
          </button>
        )}
      </div>

      {isDuplicate && <div className="form-error">重複した商品分類です</div>}
    </div>
  );
};
