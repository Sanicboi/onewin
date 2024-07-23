import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm"

@Entity()
export class User {

    @PrimaryColumn()
    id: string;

    @Column({
        nullable: true
    })
    username: string;

    @Column({
        nullable: true
    })
    oneWinId: string;

    @Column({
        nullable: true
    })
    endDate: Date;

    @Column({
        default: false
    })
    deposited: boolean;

    @Column({
        default: false
    })
    cameWithLink: boolean;
}
