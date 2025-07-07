import React from 'react';
import { FormProps } from './FormProps';
import classnames from 'classnames';
import DatePicker from 'react-datepicker';
import { parse, getYear, getMonth, format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

type FormInputDateProps = FormProps & {
  value?: string | undefined;
  placeholder?: string | undefined;
  readOnly?: boolean | undefined;
  autoFocus?: boolean | undefined;
};

export const FormInputDate: React.VFC<FormInputDateProps> = ({
  name,
  value,
  placeholder,
  error,
  readOnly,
  autoFocus,
  onChange,
  ...props
}) => {
  const selected = value ? parse(value, 'yyyy/MM/dd', new Date()) : null;

  const handleChange = (date: Date | null) => {
    if (name && onChange) {
      onChange(name, date != null ? format(date, 'yyyy/MM/dd') : undefined);
    }
  };

  return (
    <DatePicker
      name={name}
      className={classnames(['input max-w-6', error ? 'is-invalid' : ''])}
      locale="ja"
      dateFormat={'yyyy/MM/dd'}
      selected={selected}
      onChange={handleChange}
      placeholderText={placeholder}
      readOnly={readOnly}
      autoFocus={autoFocus}
      renderCustomHeader={props => (
        <div>
          <button
            type="button"
            className="react-datepicker__navigation react-datepicker__navigation--previous"
            aria-label="Previous Month"
            onClick={props.decreaseMonth}
            disabled={props.prevMonthButtonDisabled}
          >
            Previous Month
          </button>
          <div>
            {getYear(props.date)}年 {getMonth(props.date) + 1}月
          </div>
          <button
            type="button"
            className="react-datepicker__navigation react-datepicker__navigation--next"
            aria-label="Next Month"
            onClick={props.increaseMonth}
            disabled={props.nextMonthButtonDisabled}
          >
            Next Month
          </button>
        </div>
      )}
      todayButton={'本日'}
      {...props}
    />
  );
};
