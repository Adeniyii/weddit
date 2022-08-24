import React, { FC, ButtonHTMLAttributes } from 'react'
import cn from 'classnames'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  loading?: boolean;
  children: React.ReactNode;
};

const Button: FC<Props> = ({className, loading, children="submit", ...rest}) => {
	return (
    <button
      className={cn(
        "capitalize py-2 px-5 rounded text-white bg-green-600 hover:bg-green-700 mx-auto",
        { "opactiy-70 cursor-not-allowed": loading },
        className
      )}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  );
}

export default Button
