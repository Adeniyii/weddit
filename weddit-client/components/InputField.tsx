import { useField } from "formik";
import React, { FC, InputHTMLAttributes } from "react";
import cn from 'classnames'

import Wrapper from "./Wrapper";

// allows us to pass any valid html attributes to this component
type Props = InputHTMLAttributes<HTMLInputElement> & {
  variant?: "small" | "medium";
  name: string;
  label?: string;
}

const InputField: FC<Props> = ({ className, variant, name, label = name, ...rest }) => {
  const [field, meta, errors] = useField(name);
  const isError = meta.touched && meta.error;
  return (
    <Wrapper size={variant} className="">
      <form className={className}>
        <label
          htmlFor={field.name}
          className="block text-sm font-semibold text-gray-700 capitalize"
        >
          {label}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
						{...field}
            id={field.name}
            type="text"
            className={cn(
              "focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md",
              { "focus:ring-red-400 focus:border-red-400": isError }
            )}
            placeholder={rest.placeholder}
						{...rest}
          />
          {isError ? (
            <div className="text-red-300 text-sm mt-4">{meta.error}</div>
          ) : null}
        </div>
      </form>
    </Wrapper>
  );
};

export default InputField;
