import React from "react";

type Props = {
  itemNameInput: string;
  setItemNameInput: (v: string) => void;
  salesPriceInput: string;
  setSalesPriceInput: (v: string) => void;
  point: string;
  preState: any;
  exDetailsInput: string;
  setExDetailsInput: (v: string) => void;
  inputPriceFocusOut: () => void;
};

/**
 * 商品名・販売価格・ポイント・タイプ・商品説明（詳細）
 * 
 * @param param0 
 * @returns 
 */
export const ShopImageForm: React.FC<Props> = ({
  itemNameInput,
  setItemNameInput,
  salesPriceInput,
  setSalesPriceInput,
  point,
  preState,
  exDetailsInput,
  setExDetailsInput,
  inputPriceFocusOut,
}) => {
  return (
    <div id="item-info">
      {/* 商品名 */}
      <input
        id="item-name"
        value={itemNameInput}
        placeholder="商品名を入力して下さい"
        onChange={(e) => setItemNameInput(e.target.value)}
      />

      <hr />

      {/* 販売価格 */}
      <div id="price-col">
        <label className="label-basic">￥</label>
        <input
          id="input-price"
          value={salesPriceInput}
          placeholder="金額を入力して下さい"
          onChange={(e) => setSalesPriceInput(e.target.value)}
          onBlur={inputPriceFocusOut}
        />
        <label className="label-basic">（税込み）</label>
      </div>

      {/* ポイント */}
      <label className="point-label">ポイント：{point}pt</label>

      {/* タイプ名（type_status が 0 以外のとき） */}
      {preState.type_status !== 0 && preState.type_status !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            padding: "0",
            marginTop: "5px",
            marginBottom: "5px",
          }}
        >
          <a className="document_url" href={preState.document_url}>
            {preState.type_name}
          </a>
        </div>
      )}

      <hr />

      {/* 商品説明（詳細） */}
      <div id="item-detail-erea">
        <label className="label-basic">この商品について</label>
        <textarea
          id="item-detail"
          value={exDetailsInput}
          placeholder="説明文を入力して下さい"
          onChange={(e) => setExDetailsInput(e.target.value)}
        />
      </div>
    </div>
  );
};
