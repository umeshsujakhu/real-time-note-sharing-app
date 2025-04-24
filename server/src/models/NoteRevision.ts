import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Note } from "./Note";

@Entity("note_revisions")
export class NoteRevision {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  content: string;

  @Column()
  version: number;

  @ManyToOne(() => Note, (note) => note.revisions)
  @JoinColumn({ name: "noteId" })
  note: Note;

  @Column()
  noteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
