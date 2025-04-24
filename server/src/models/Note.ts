import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { NoteRevision } from "./NoteRevision";
import { NoteShare } from "./NoteShare";

@Entity("notes")
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => User, (user) => user.notes)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => NoteRevision, (revision) => revision.note)
  revisions: NoteRevision[];

  @OneToMany(() => NoteShare, (share) => share.note)
  shares: NoteShare[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  version: number;

  // Incrementing the version number when the note is updated
  incrementVersion() {
    this.version += 1;
    return this.version;
  }
}
