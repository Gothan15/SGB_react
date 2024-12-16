import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineUnlock,
} from "react-icons/ai";

const FormInput = ({
  type,
  id,
  name,
  value,
  onChange,
  label,
  icon: Icon,
  showPasswordToggle,
  isPasswordVisible,
  togglePassword,
  validationMessage,
  validationColor,
}) => (
  <div className="relative text-base md:text-2xl focus:outline-none focus:ring-0">
    <Input
      type={type}
      id={id}
      name={name}
      className="w-full py-2 px-0 text-base md:text-xl text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-white focus:border-yellow-600 peer"
      placeholder=""
      required
      value={value}
      onChange={onChange}
    />
    <label
      htmlFor={id}
      className="absolute text-gray-400 duration-300 transform translate-y-[-58px] scale-75 origin-[0] peer-focus:translate-y-[-58px] peer-focus:text-yellow-600 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-32px] peer-focus:scale-75 font-sans antialiased font-semibold text-xl"
    >
      {label}
    </label>
    {Icon && (
      <Icon className="absolute text-white right-[5px] top-[5px] transform text-2xl" />
    )}
    {showPasswordToggle && (
      <div className="absolute right-[50px] top-[5px] flex gap-2">
        <button
          type="button"
          onClick={togglePassword}
          className="text-white hover:text-yellow-500 transition-colors"
        >
          {isPasswordVisible ? (
            <AiOutlineEyeInvisible className="text-2xl" />
          ) : (
            <AiOutlineEye className="text-2xl" />
          )}
        </button>
        <AiOutlineUnlock className="text-white text-2xl" />
      </div>
    )}
    {validationMessage && (
      <p className={`text-sm mt-2 ${validationColor}`}>{validationMessage}</p>
    )}
  </div>
);

FormInput.propTypes = {
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  icon: PropTypes.elementType,
  showPasswordToggle: PropTypes.bool,
  isPasswordVisible: PropTypes.bool,
  togglePassword: PropTypes.func,
  validationMessage: PropTypes.string,
  validationColor: PropTypes.string,
};

export default FormInput;
