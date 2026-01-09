type VariationRowProps = {
  item: string[];
  itemIndex: number;
  isEditable: boolean;
  onChangeValue: (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => void;
  onAdd: (row: number, col: number) => void;
  onDelete: (row: number) => void;
  onFocus: (item: string[]) => void;
  onBlur: (item: string[]) => void;
  showDelete: boolean;
  isDisabled: boolean;
  errorMap: boolean[][];
};

export const ItemVariationRow = ({
  item,
  itemIndex,
  isEditable,
  onChangeValue,
  onAdd,
  onDelete,
  onFocus,
  onBlur,
  showDelete,
  errorMap,
}: VariationRowProps) => {
  return (
    <div className="variation-row">
      {item.map((value, index) =>
        index > 0 ? (
          <div key={index} className="variation-row-cell">

            {/* 入力欄＋ボタン */}
            <div className="variation-input-wrapper">
              <input
                className={`vari-row-input ${
                  errorMap?.[itemIndex]?.[index] ? 'error-input' : ''
                } variation-row-input`}
                disabled={!isEditable}
                value={value ?? ''}
                onChange={(e) => onChangeValue(e, itemIndex, index)}
                onFocus={() => onFocus(item)}
                onBlur={() => onBlur(item)}
                data-error={errorMap?.[itemIndex]?.[index] ? '1' : '0'}
                data-visible={value === null ? '0' : '1'}
                data-editable={isEditable ? '1' : '0'}
              />

              {index < 5 && (
                <button
                  disabled={!isEditable}
                  className="variation-plus-button variation-plus-inside"
                  onClick={() => onAdd(itemIndex, index)}
                  data-visible={value === null ? '0' : '1'}
                  data-editable={isEditable ? '1' : '0'}
                >
                  ＋
                </button>
              )}
            </div>

            {/* 横線テンプレート */}
            {index < item.length - 1 && (
              <div className="variation-tree-cell">
                <svg className="tree-svg" width="33" height="32">
                  {value !== null && (
                    <line
                      x1="0"
                      y1="16"
                      x2="33"
                      y2="16"
                      className="tree-line-horizontal"
                    />
                  )}
                </svg>
              </div>
            )}

          </div>
        ) : null
      )}

      {showDelete && (
        <button
          className="btn-delete variation-delete-button"
          onClick={() => onDelete(itemIndex)}
          disabled={!isEditable}
        >
          削除
        </button>
      )}
    </div>
  );
};
