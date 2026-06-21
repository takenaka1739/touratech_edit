export type PrefectureShippingRate = {
  id?: number;
  prefecture: string;
  amount: number;
  sort_order: number;
};

export type RemoteIslandShippingRate = {
  id?: number;
  prefecture?: string | null;
  municipality?: string | null;
  area_names?: string | null;
  amount: number;
  sort_order: number;
};

export type FreeShippingThresholds = {
  send_personal?: number;
  send_trader?: number;
};

export type ShippingRateState = {
  free_shipping_thresholds: FreeShippingThresholds;
  prefecture_rates: PrefectureShippingRate[];
  remote_island_rates: RemoteIslandShippingRate[];
};
