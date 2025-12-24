export const ItemVariationHeader = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <label style={{ whiteSpace: "nowrap" }}>バリエーション1</label>
      <label style={{ whiteSpace: "nowrap", marginLeft: '60px' }}>バリエーション2</label>
      <label style={{ whiteSpace: "nowrap", marginLeft: '60px' }}>バリエーション3</label>
      <label style={{ whiteSpace: "nowrap", marginLeft: '60px' }}>バリエーション4</label>
      <label style={{ whiteSpace: "nowrap", marginLeft: '55px' }}>品番</label>
      <label style={{ whiteSpace: "nowrap", marginLeft: '100px' }}>販売価格（税込）</label>
    </div>
  );
};
