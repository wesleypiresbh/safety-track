const Button = ({ onClick, type = 'button', children, className }) => (
  <button
    type={type}
    onClick={onClick}
    className={`w-full py-2 rounded transition duration-200 ${className}`}
  >
    {children}
  </button>
);

export default Button;
