import { PASSWORD_NOTIFICATION } from "@/firebaseConfig";

const PasswordStatus = (passwordStatus) => {
  return (
    <div className="mt-4 w-max  rounded-lg bg-black   text-center p-1 uppercase font-bold  mb-1  text-gray-900">
      <p
        className={`text-sm ${
          passwordStatus.isExpired
            ? "bg-red-500"
            : passwordStatus.daysUntilExpiration <=
              PASSWORD_NOTIFICATION.WARN_DAYS_BEFORE
            ? "bg-yellow-500"
            : "bg-green-500"
        }`}
      >
        {passwordStatus.isExpired
          ? "Tu contraseña ha expirado"
          : passwordStatus.daysUntilExpiration
          ? `Tu contraseña expira en ${passwordStatus.daysUntilExpiration} días`
          : "Estado de contraseña no disponible"}
      </p>
    </div>
  );
};

export default PasswordStatus;
