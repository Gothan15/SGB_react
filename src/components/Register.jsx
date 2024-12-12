// React y Terceros
import { useState } from "react";
import LoadinSpinner from "./ui/LoadinSpinner";
import QuoteSection from "./auth/QuoteSection";
import RegisterForm from "./auth/RegisterForm";

const Register = () => {
  const [uiState, setUiState] = useState({
    newUser: false,
    error: "",
    loading: false,
  });

  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiration, setLockExpiration] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  return (
    <>
      <div className="text-white">
        <div className="flex min-h-screen">
          <div className="flex w-1/2 items-end p-12">
            <div className="space-y-4">
              <QuoteSection />
            </div>
          </div>

          <div className="flex rounded-md bg-opacity-50 p-8 shadow-black shadow-lg backdrop:blur-sm bg-[#000000] w-1/2 items-center justify-center">
            {uiState.loading ? (
              <LoadinSpinner />
            ) : (
              <RegisterForm
                uiState={uiState}
                setUiState={setUiState}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
                lockExpiration={lockExpiration}
                setLockExpiration={setLockExpiration}
                remainingTime={remainingTime}
                setRemainingTime={setRemainingTime}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
