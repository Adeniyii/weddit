import { FC } from "react";
import cn from "classnames";

interface Props {
  children: React.ReactNode;
  size?: "small" | "medium";
  className?: string;
}

const Wrapper: FC<Props> = ({ children, size, className }) => {
  return (
    <div
      className={cn(
        "mx-auto px-8 w-full",
        {
          "max-w-md": size === "small",
          "max-w-3xl": size === "medium",
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export default Wrapper;
