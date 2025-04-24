import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Note } from "./Note";

export enum SharePermission {
  READ = "read",
  EDIT = "edit",
}

@Entity("note_shares")
export class NoteShare {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Note, (note) => note.shares)
  @JoinColumn({ name: "noteId" })
  note: Note;

  @Column()
  noteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sharedWithId" })
  sharedWith: User;

  @Column({ nullable: true })
  sharedWithId: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: "enum",
    enum: SharePermission,
    default: SharePermission.READ,
  })
  permission: SharePermission;

  @Column({ default: false })
  isAccepted: boolean;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true, unique: true })
  shareToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
