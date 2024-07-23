import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Signup } from "./entity/Signup"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "postgres",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    synchronize: true,
    logging: false,
    entities: [User, Signup],
    migrations: [],
    subscribers: [],
})
