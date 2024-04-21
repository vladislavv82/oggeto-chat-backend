import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { ValidObjectId } from 'src/utils/validators/valid-object-id';

export class JoinChatRoomDto {
  @IsNotEmpty()
  @IsString()
  @Validate(ValidObjectId)
  chatRoomId: string;
}
