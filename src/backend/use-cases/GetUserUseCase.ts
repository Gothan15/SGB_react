import { getDocs } from "firebase/firestore";
import { IUserRepository, UserRepository } from "../repositories/UsersRepository";
import { injected } from "brandi";
import { SERVICES } from "@/Tokens";

interface User {
    id: string;
    name: string;
    role: string;
}

export class GetUserUseCase{
    constructor(private readonly userRepository: IUserRepository){}

    async execute(){
        const usersSnapshot = await getDocs(this.userRepository.getAll())

        return usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
    }
}

injected(GetUserUseCase,SERVICES.userRepository);