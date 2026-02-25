import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { Calendar } from '@/types';

type CalendarDetailPageState = Calendar;

export const useCalendarDetailPage = (slug: string) => {
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<CalendarDetailPageState>(slug, {
    id: undefined,
    name: '',
    start_at: '',
    end_at: '',
    is_monday: false,
    is_tuesday: false,
    is_wednesday: false,
    is_thursday: false,
    is_friday: false,
    is_saturday: false,
    is_sunday: false,
    	font_color: '',
    back_color: '',
    trans_flag: false
  });

  return {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,
    onClickSave,
    onClickDelete,
  };
};