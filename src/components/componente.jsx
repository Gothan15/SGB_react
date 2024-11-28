import { USE_CASES } from "@/Tokens";
import { useInjection } from "brandi-react";
import { useEffect, useState } from "react";

export default function ComponenteMio() {
  const getUsersUseCase = useInjection(USE_CASES.getUsersUseCase);
  const [state, setState] = useState([]);

  useEffect(() => {
    getUsersUseCase.execute().then((res) => {
      setState(res);
    });
  });

  return (
    <div>
      <h1>Componente mio</h1>
      {state.map((user) => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
}
