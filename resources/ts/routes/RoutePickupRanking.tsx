import { Switch, Route } from 'react-router-dom';
import PickupRankingListPage from '@/app/PickupRanking/pages/PickupRankingListPage';
import { PickupRankingDetailPage } from '@/app/PickupRanking/pages/pickupRankingDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

/**
 * 注目ランキングマスタ ルーティング
 *
 * クーポンマスタ（RouteCoupon）と同じ構成
 * - 一覧
 * - 詳細（new / id）
 */
const RoutePickupRanking: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/pickup_ranking" component={PickupRankingListPage} />
      <Route path="/pickup_ranking/detail/:id(new|\d+)" component={PickupRankingDetailPage} />
      <Route path="/pickupranking/:id" component={PickupRankingDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default RoutePickupRanking;
