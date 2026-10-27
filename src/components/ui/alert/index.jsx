import clsx from 'clsx';

export const Alert = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'rounded-md p-4 flex items-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className, ...props }) => {
  return (
    <div className={clsx('text-sm font-medium', className)} {...props}>
      {children}
    </div>
  );
};