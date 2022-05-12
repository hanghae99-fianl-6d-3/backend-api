import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GroupUser } from './group-user.entity';
import { Group } from './group.entity';
import { UserBlock } from './user-block.entity';
import { UserFollow } from './user-follow.entity';
import { UserPoint } from './user-point.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column('varchar')
  kakaoId: string;

  @Column({ type: 'varchar', default: String(Date.now()) })
  nickname: string;

  @Column({ type: 'varchar', default: null })
  profileImageUrl: string;

  @Column({ type: 'int', default: null })
  careerId: number;

  @Column({ type: 'varchar', default: null })
  year: string;

  @Column({ type: 'text', default: null })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ default: null })
  deletedAt: Date;

  // 사용자 : 점수 = 1 : N
  @OneToMany(() => UserPoint, (userPoint) => userPoint.userId, {
    cascade: true,
  })
  @JoinColumn({ name: 'point' })
  point: UserPoint[];

  // 사용자 : 팔로잉 = 1 : N
  @OneToMany(() => UserFollow, (UserFollow) => UserFollow.userId, {
    cascade: true,
  })
  @JoinColumn({ name: 'following' })
  following: UserFollow[];

  // 사용자 : 팔로워 = 1 : N
  @OneToMany(() => UserFollow, (userFollow) => userFollow.followUserId, {
    cascade: true,
  })
  @JoinColumn({ name: 'follower' })
  follower: UserFollow[];

  // 사용자 : 차단 = 1 : N
  @OneToMany(() => UserBlock, (userBlock) => userBlock.blockUserId, {
    cascade: true,
  })
  @JoinColumn({ name: 'blocker' })
  blocker: UserBlock[];

  // 사용자 : 그룹(호스트) = 1 : N
  @OneToMany(() => Group, (group) => group.host, {
    cascade: true,
  })
  @JoinColumn({ name: 'hostGroups' })
  hostGroups: Group[];

  // 사용자 : 그룹(참여자) = 1 : N
  @OneToMany(() => GroupUser, (groupUser) => groupUser.guest, {
    cascade: true,
  })
  @JoinColumn({ name: 'guestGroups' })
  guestGroups: Group[];
}
