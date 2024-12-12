// Agregar función de validación de contraseña
const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  let message = "";
  let color = "";

  switch (strength) {
    case 5:
      message = "Muy fuerte";
      color = "text-green-500";
      break;
    case 4:
      message = "Fuerte";
      color = "text-green-400";
      break;
    case 3:
      message = "Moderada";
      color = "text-yellow-500";
      break;
    case 2:
      message = "Débil";
      color = "text-orange-500";
      break;
    default:
      message = "Muy débil";
      color = "text-red-500";
      break;
  }

  return { strength, checks, message, color };
};

export default validatePassword;
