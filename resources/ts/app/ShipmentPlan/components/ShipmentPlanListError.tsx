export const ShipmentPlanListError = (errMsg: string, item_numbers: string[]) => {
  return (
    <div className="max-h-screen overflow-y-scroll">
      <div className="text-red-600">{errMsg}</div>
      <ul className="mt-2 text-sm">
        {item_numbers.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
};
