import { ApiProperty } from '@nestjs/swagger';
import { Follow } from 'src/follow/follow.entity';
import { Point } from 'src/point/point.entity';

export class UserInfoRow {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'alonerz' })
  nickname: string;

  @ApiProperty({ example: null })
  profileImageUrl: string;

  @ApiProperty({ example: '신입' })
  year: string;

  @ApiProperty({ example: '신입 백엔드 개발자입니다.' })
  description: string;

  @ApiProperty({ example: 1 })
  careerId: number;

  @ApiProperty({ example: 200 })
  following: Follow[] | number;

  @ApiProperty({ example: 200 })
  follower: Follow[] | number;

  @ApiProperty({ example: 999 })
  point: Point[] | number;
}