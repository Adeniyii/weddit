import { useField } from "formik";
import React, { FC, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import cn from 'classnames'

// allows us to pass any valid html attributes to this component
type Props = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement> & {
      variant?: "small" | "medium";
      name: string;
      label?: string;
      textArea?: boolean;
    };

const InputField: FC<Props> = ({ className, variant, name, textArea, label = name, ...rest }) => {
  const [field, meta, errors] = useField(name);
  const isError = meta.touched && meta.error;
  return (
    <>
      <div className={className}>
        <label
          htmlFor={field.name}
          className="block text-sm font-semibold text-gray-700 capitalize"
        >
          {label}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          {textArea ? (
            <textarea
              {...field}
              id={field.name}
              className={cn(
                "focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md",
                { "focus:ring-red-400 focus:border-red-400": isError }
              )}
              placeholder={rest.placeholder}
              {...rest}
            />
          ) : (
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
          )}
          {isError ? (
            <div className="text-red-300 text-sm mt-4">{meta.error}</div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default InputField;
