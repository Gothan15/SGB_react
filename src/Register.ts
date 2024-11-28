import { Container } from "brandi";
import { SERVICES, USE_CASES } from "./Tokens";
import { GetUserUseCase } from "./backend/use-cases/GetUserUseCase";
import { UserRepository } from "./backend/repositories/UsersRepository";

const serviceContainer = new Container();
const ucContainer = new Container().extend(serviceContainer);

//Servicios
serviceContainer
  .bind(SERVICES.userRepository)
  .toInstance(UserRepository)
  .inSingletonScope();

//UseCases
ucContainer
  .bind(USE_CASES.getUsersUseCase)
  .toInstance(GetUserUseCase)
  .inTransientScope();

export { ucContainer as container };
