import { Entity, PrimaryColumn } from "typeorm";


@Entity()
export class Signup {
    @PrimaryColumn()
    id: string;
}