import React, { type FC, type ReactNode, type FormEvent } from "react";

interface FormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  className?: string;
  noValidate?: boolean;
}

const Form: FC<FormProps> = ({ onSubmit, children, className = "", noValidate = true }) => {
  return (
    <form
      noValidate={noValidate}
      onSubmit={(event) => {
        event.preventDefault(); // Prevent default form submission
        onSubmit(event);
      }}
      className={` ${className}`} // Default spacing between form fields
    >
      {children}
    </form>
  );
};

export default Form;
