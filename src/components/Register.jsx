// React y Terceros
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
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

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          navigate(`/${role}`);
        }
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  return (
    <>
      <div className="text-white register-component">
        <div className="flex min-h-screen flex-col md:flex-row">
          <div className="flex w-full md:w-1/2 items-end p-6 md:p-12">
            <div className="space-y-4">
              <QuoteSection />
            </div>
          </div>

          <div className="flex rounded-md bg-opacity-50 p-4 md:p-8 shadow-black shadow-lg backdrop:blur-sm bg-[#000000] w-full md:w-1/2 items-center justify-center">
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
