import React from 'react';
import classnames from 'classnames';

type FormGroupProps = {
  error?: string | string[] | undefined;
  groupClassName?: string;
  labelText: string;
  removeOptionalLabel?: boolean | undefined;
  required?: boolean;
  children?: React.ReactNode;
};

export const FormGroup: React.VFC<FormGroupProps> = ({
  error,
  groupClassName,
  labelText,
  removeOptionalLabel,
  required,
  children,
}) => {
  let errors: string[] = [];
  if (error) {
    if (!Array.isArray(error)) {
      errors = [error];
    } else {
      errors = error.filter(x => x);
    }
  }
  const err = errors.map((message, i) => (
    <div className="form-error" key={i}>
      {message}
    </div>
  ));

  return (
    <div className={classnames(['form-group', groupClassName ?? 'mt-3'])}>
      <label className={classnames('form-label', removeOptionalLabel ? 'form-label-removed' : '')}>
        <div className="form-label__inner">
          <span className="form-label-text" dangerouslySetInnerHTML={{ __html: labelText }} />
          {!removeOptionalLabel ? (
            required ? (
              <span className="is-required">必須</span>
            ) : (
              <span className="is-optional">任意</span>
            )
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      </label>
      <div className="flex-grow">
        {children}
        {err}
      </div>
    </div>
  );
};
