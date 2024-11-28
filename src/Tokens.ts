import { token } from "brandi";
import { IUserRepository } from "./backend/repositories/UsersRepository";
import { GetUserUseCase } from "./backend/use-cases/GetUserUseCase";

const SERVICES = {
  userRepository: token<IUserRepository>("userRepository"),
};

const USE_CASES = {
  getUsersUseCase: token<GetUserUseCase>("getUsersUseCase"),
};

export { USE_CASES, SERVICES };
