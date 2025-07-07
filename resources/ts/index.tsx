import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { registerLocale } from 'react-datepicker';
import ReactModal from 'react-modal';
import axios from 'axios';
import ja from 'date-fns/locale/ja';
import App from '@/app';
import store from '@/store';
import { getCsrfToken } from '@/utils/getCsrfToken';

// datepickerのスタイルと日本語対応
import 'react-datepicker/dist/react-datepicker.css';
registerLocale('ja', ja);

ReactModal.setAppElement('#app');

// laravel用設定
axios.defaults.headers.common = {
  'X-CSRF-TOKEN': getCsrfToken(),
  'X-Requested-With': 'XMLHttpRequest',
};

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      window.location.href = '/login';
      return;
    }
    return error.response;
  }
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);
