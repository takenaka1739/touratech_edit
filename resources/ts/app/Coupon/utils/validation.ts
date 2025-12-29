//import { CouponRule } from '@/types/Coupon';

/**
 * 商品マスタの必須項目の未入力を検出し、入力不足時はエラーメッセージを返す。
 * 
 * @param state - 商品情報を保持する Item 型のオブジェクト
 * @returns エラーあり：エラーメッセージ、エラーなし：null
 */


//const couponDetailError = () => {
//
//}
//
//const couponRuleError = () => {
//
//}

const cleanRuleErrors = (ruleError: Record<string, any>) => {
  Object.keys(ruleError).forEach(key => {
    if (ruleError[key] === '' || ruleError[key] == null) {
      delete ruleError[key];
    }
  });
  return ruleError;
};


export const validateItemState = (state: any): Record<string, any> => {
  console.log('state');
  console.dir(state);
  const errors: Record<string, any> = {};

  if (state.code == null || state.code === '') errors.code = 'クーポンコードは必須です';

  if (state.code.length > 12) errors.code = 'クーポンコードは必須で、12桁以内で入力してください';

  if (!state.name) errors.name = 'クーポン名は必須です';
  
  if (!state.start_at) errors.start_at = '開始日は必須です';

  if (!state.end_at) errors.end_at = '終了日は必須です';
  
  // ★ rules を配列として初期化
  errors.rules = [];

  state.rules.forEach((rule: any, index: number) => {
    // まず空オブジェクトを用意
    errors.rules[index] = errors.rules[index] || {};

    if (!rule.condition_type) {
      errors.rules[index].condition_type = '選択してください';
      if (rule.condition_value.length === 0) errors.rules[index].condition_value = '条件値を設定してください';
    }else if(rule.condition_type === 'all_items'){
      errors.rules[index].condition_value = '';
    }else{
      if (rule.condition_value.length === 0) errors.rules[index].condition_value = '選択してください';
    }

    if (!rule.benefit_type) {
      errors.rules[index].benefit_type = '選択してください';
    }else{
      if(rule.benefit_type === 'discount'){
        if(!rule.benefit_value.value) errors.rules[index].benefit_value = '割引値を入力してください';
      }else if(rule.benefit_type === 'free_item'){
        if(!rule.benefit_value.value && !Array.isArray(rule.benefit_value.value) && rule.benefit_value.value.length === 0)
          errors.rules[index].benefit_value = '商品内容を入力してください';
      }
    }

    if (rule.benefit_type) {
      if (!rule.benefit_value) {
        errors.rules[index].benefit_value = '選択してください';
      }
    }

    if(rule.condition_type === 'price'){
      if (!rule.condition_value) errors.rules[index].condition_value = '金額を入力してください';
    }
  });

  errors.rules = errors.rules.map((ruleError:any) => cleanRuleErrors(ruleError));
  // ★ rules の中身がすべて空なら rules 自体を削除
  if (errors.rules.every((rule: any) => Object.keys(rule).length === 0)) {
    delete errors.rules;
  }

  return errors;
};
