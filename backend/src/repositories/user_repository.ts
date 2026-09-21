import { injectable } from "inversify";

@injectable()
export class UserRepository {

    public async test(): Promise<string> {
        return "User repository is working";
    }

}