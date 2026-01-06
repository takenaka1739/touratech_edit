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
  isDisabled,
}: VariationRowProps) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
      {item.map((value, index) =>
        index > 0 ? (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              visibility: value === null ? 'hidden' : 'visible',
            }}
          >
            <input
              className="vari-row-input"
              style={{
                borderRight: '1px solid #a0aec0',
                backgroundColor: isEditable ? '#ffffff' : '#EDF2F7',
                marginRight: '5px',
              }}
              disabled={!isEditable}
              value={value}
              onChange={(e) => onChangeValue(e, itemIndex, index)}
              onFocus={() => onFocus(item)}
              onBlur={() => onBlur(item)}
            />

            {index < 5 && (
              <button
                disabled={!isEditable}
                style={{ backgroundColor: isEditable ? '#ffffff' : '#EDF2F7' }}
                className="plus-button"
                onClick={() => onAdd(itemIndex, index)}
              >
                ＋
              </button>
            )}
          </div>
        ) : null
      )}

      {showDelete && (
        <button
          className="btn-delete"
          style={{ height: '26px', padding: '0 5px', whiteSpace: 'nowrap' }}
          onClick={() => onDelete(itemIndex)}
          disabled={isDisabled}
        >
          削除
        </button>
      )}
    </div>
  );
};
