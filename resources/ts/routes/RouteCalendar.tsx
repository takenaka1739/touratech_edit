import { Switch, Route } from 'react-router-dom';
//import CouponListPage from '@/app/Coupon/pages/CouponListPage';
import { CalendarListPage } from '@/app/Calendar/pages/CalendarListPage';
import { CalendarDetailPage } from '@/app/Calendar/pages//CalendarDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteCalendar: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/calendar" component={CalendarListPage} />
      <Route exact path="/calendar/detail/:id(new|\d+)" component={CalendarDetailPage} />
      <Route exact path="/calendar/:id" component={CalendarDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
};

export default RouteCalendar;
