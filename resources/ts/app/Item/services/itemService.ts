import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ItemPayload } from '@/types/ItemPayload';
import { appAlert, backPage } from '../utils/navigation';
import { AppActions } from '../store/appSlice';
import { dispatch } from '../store/store';

const dispatch = useDispatch();

// variations 整形を共通化
function buildVariations(variChangeItem: string[][]) {
  return variChangeItem.map((value: string[]) => ({
    variations1: value[1],
    variations2: value[2],
    variations3: value[3],
    variations4: value[4],
    item_number: value[5],
    sales_price: Number(value[6]),
  }));
}

// 新規登録処理
export async function handleNewItem(state: any, variChangeItem: string[][]): Promise<boolean> {
  const variations = buildVariations(variChangeItem);

  const payload: ItemPayload = { ...state, variations };
  const success = await storeNewItem(payload);

  if (success) {
    await appAlert('新規保存しました。');
    backPage();
    return true;
  } else {
    dispatch(AppActions.failed('データの保存に失敗しました。'));
    return false;
  }
}

/**
 * 商品マスタへの新規登録処理を行う。
 * 
 * @param state - 商品情報を保持するオブジェクト (Item型)
 * @returns boolean - true：登録成功、false：登録失敗
 */
const storeNewItem = async (payload: ItemPayload): Promise<boolean> => {
  try {
    dispatch(AppActions.request());

    const res = await axios.post('/api/item/store_transaction', payload);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        return true;
      } else {
        setErrors(res.data.errors);
        return false;
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
      return false;
    }
  } catch (error) {
    dispatch(AppActions.failed('通信エラーが発生しました。'));
    return false;
  }
};