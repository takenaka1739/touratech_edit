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
          <div
            key={index}
            className="variation-row-cell"
          >
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
                className="plus-button variation-plus-button"
                onClick={() => onAdd(itemIndex, index)}
                data-visible={value === null ? '0' : '1'}
                data-editable={isEditable ? '1' : '0'}
              >
                ＋
              </button>
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
