import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomsService } from './chat-rooms.service';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ChatRoom, ChatRoomSchema } from 'src/schemas/chat-room.schema';
import { TestModule } from 'src/test.module';
import { Model } from 'mongoose';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Chat, ChatSchema } from 'src/schemas/chat.schema';
import {
  generateTestChatRoomName,
  generateTestMessage,
  generateTestUserName,
} from 'src/utils/test-helpers';

describe('ChatRoomsService', () => {
  let module: TestingModule;
  let service: ChatRoomsService;

  let chatRoomModel: Model<ChatRoom>;
  let userModel: Model<User>;
  let chatModel: Model<Chat>;

  let chatRoom: ChatRoom;
  let user: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestModule,
        MongooseModule.forFeature([
          {
            name: ChatRoom.name,
            schema: ChatRoomSchema,
          },
          {
            name: Chat.name,
            schema: ChatSchema,
          },
          {
            name: User.name,
            schema: UserSchema,
          },
          {
            name: Chat.name,
            schema: ChatSchema,
          },
        ]),
      ],
      providers: [ChatRoomsService],
    }).compile();

    service = module.get<ChatRoomsService>(ChatRoomsService);
    chatRoomModel = module.get<Model<ChatRoom>>(getModelToken(ChatRoom.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));
    chatModel = module.get<Model<Chat>>(getModelToken(Chat.name));

    const [_chatRoom, _user] = await Promise.all([
      new chatRoomModel({
        name: generateTestChatRoomName(),
      }).save(),
      new userModel({
        name: generateTestUserName(),
      }).save(),
    ]);

    chatRoom = _chatRoom;
    user = _user;

    // console.log({ chatRoom, user });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service.create).toBeDefined();
    });

    it('should create a chat room', async () => {
      const dto = new CreateChatRoomDto();
      dto.name = generateTestChatRoomName();
      const result = await service.create(dto);

      // console.log({ result });

      expect(result).toBeDefined();
      expect(result.name).toEqual(dto.name);
    });
  });

  describe('findOneById', () => {
    it('should be defined', () => {
      expect(service.findOneById).toBeDefined();
    });

    it('should find a chat room by object id', async () => {
      const id = chatRoom._id;
      const result = await service.findOneById(id);

      // console.log({ result });

      expect(result).toBeDefined();
      expect(result._id).toEqual(id);
    });

    it('should find a chat room by string id', async () => {
      const id = chatRoom._id;
      const result = await service.findOneById(id.toString());

      // console.log({ result });

      expect(result).toBeDefined();
      expect(result._id).toEqual(id);
    });
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should find all chat rooms', async () => {
      const result = await service.findAll();

      // console.log({ result });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: chatRoom._id,
          }),
        ]),
      );
    });
  });

  describe('addParticipantToChatRoom', () => {
    it('should be defined', () => {
      expect(service.addParticipantToChatRoom).toBeDefined();
    });

    it('should add participant to a chat room', async () => {
      const chatRoomId = chatRoom._id;
      const userId = user._id;
      const result = await service.addParticipantToChatRoom({
        chatRoomId,
        userId,
      });

      expect(result).toBeDefined();

      const updatedChatRoom = await chatRoomModel.findById(chatRoomId);

      // console.dir({ updatedChatRoom }, { depth: null });

      expect(updatedChatRoom.participants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: userId,
          }),
        ]),
      );
    });
  });

  describe('isUserParticipatedInChatRoom', () => {
    it('should be defined', () => {
      expect(service.isUserParticipatedInChatRoom).toBeDefined();
    });

    it('should return true', async () => {
      const userId = user._id;
      const chatRoom = await new chatRoomModel({
        name: generateTestChatRoomName(),
        participants: [userId],
      }).save();

      const chatRoomId = chatRoom._id;

      const result = await service.isUserParticipatedInChatRoom({
        chatRoomId,
        userId,
      });

      expect(result).toBe(true);
    });

    it('should return false', async () => {
      const userId = user._id;
      const chatRoom = await new chatRoomModel({
        name: generateTestChatRoomName(),
      }).save();

      const chatRoomId = chatRoom._id;

      const result = await service.isUserParticipatedInChatRoom({
        chatRoomId,
        userId,
      });

      expect(result).toBe(false);
    });
  });

  describe('addChatToChatRoom', () => {
    it('should be defined', () => {
      expect(service.addChatToChatRoom).toBeDefined();
    });

    it('should add chat to a chat room', async () => {
      const chatRoomId = chatRoom._id;
      const userId = user._id;
      const message = generateTestMessage();

      const result = await service.addChatToChatRoom({
        chatRoomId,
        userId,
        message,
      });

      expect(result).toBeDefined();

      const updatedChatRoom = await chatRoomModel.findById(chatRoomId).populate('chats');

      // console.dir({ updatedChatRoom }, { depth: null });

      expect(updatedChatRoom.chats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message,
          }),
        ]),
      );
    });
  });

  describe('isChatBelongsToUser', () => {
    it('should be defined', () => {
      expect(service.isChatBelongsToUser).toBeDefined();
    });

    it('should return true', async () => {
      const chat = await new chatModel({
        message: generateTestMessage(),
        user,
      }).save();

      const result = await service.isChatBelongsToUser({
        chatId: chat._id,
        userId: user._id,
      });

      expect(result).toBe(true);
    });

    it('should return false', async () => {
      const chat = await new chatModel({
        message: generateTestMessage(),
        user: new userModel({
          name: generateTestUserName(),
        }),
      }).save();

      const result = await service.isChatBelongsToUser({
        chatId: chat._id,
        userId: user._id,
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteChat', () => {
    it('should be defined', () => {
      expect(service.deleteChat).toBeDefined();
    });

    it('should delete a chat', async () => {
      const chat = await new chatModel({
        message: generateTestMessage(),
        user,
      }).save();

      const result = await service.deleteChat(chat._id);

      expect(result).toBeDefined();
      expect(result._id).toEqual(chat._id);

      const findDeletedChat = await chatModel.findById(chat._id);
      expect(findDeletedChat).toBeNull();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
