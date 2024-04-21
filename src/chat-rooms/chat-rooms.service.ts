import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ChatRoom } from 'src/schemas/chat-room.schema';
import { Model, ObjectId } from 'mongoose';
import { Chat } from 'src/schemas/chat.schema';
import { User } from 'src/schemas/user.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class ChatRoomsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChatRoomsService.name);

  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoom>,

    @InjectModel(Chat.name)
    private readonly chatModel: Model<Chat>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(createChatRoomDto: CreateChatRoomDto) {
    return await this.chatRoomModel.create(createChatRoomDto);
  }

  async findOneById(id: string | ObjectId) {
    return await this.chatRoomModel.findById(id).populate([
      {
        path: 'participants',
        select: ['_id', 'name'],
      },
      {
        path: 'chats',
        populate: {
          path: 'user',
          select: ['_id', 'name'],
        },
      },
    ]);
  }

  async findAll() {
    return await this.chatRoomModel
      .find()
      .select('-chats')
      .populate({
        path: 'participants',
        select: ['_id', 'name'],
      });
  }

  async addParticipantToChatRoom({
    chatRoomId,
    userId,
  }: {
    chatRoomId: ObjectId | string;
    userId: ObjectId | string;
  }) {
    return await this.chatRoomModel.findByIdAndUpdate(chatRoomId, {
      $push: { participants: userId },
    });
  }

  async isUserParticipatedInChatRoom({
    chatRoomId,
    userId,
  }: {
    chatRoomId: ObjectId | string;
    userId: ObjectId | string;
  }) {
    const count = await this.chatRoomModel.count({ _id: chatRoomId, participants: userId });
    return !!count;
  }

  async addChatToChatRoom({
    chatRoomId,
    userId,
    message,
  }: {
    chatRoomId: ObjectId | string;
    userId: ObjectId | string;
    message: string;
  }) {
    const chat = await this.chatModel.create({ message, user: userId });
    await this.chatRoomModel.findByIdAndUpdate(chatRoomId, {
      $push: { chats: chat },
    });

    return await chat.populate({
      path: 'user',
      select: ['_id', 'name'],
    });
  }

  async onApplicationBootstrap() {
    await this.generateChatRooms();
  }

  async generateChatRooms() {
    let chatRooms = await this.findAll();

    if (chatRooms.length === 0) {
      const chatRoomsPromises = [];

      for (let i = 1; i <= 10; i++) {
        const usersPromises = [];

        for (let j = 0; j <= i; j++) {
          const user = this.userModel.create({
            name: faker.person.fullName(),
          });

          usersPromises.push(user);
        }

        const users: User[] = await Promise.all(usersPromises);

        // console.log({ users });

        const chatsPromises = [];

        for (let j = 0; j <= i; j++) {
          const chat = this.chatModel.create({
            message: faker.word.words(10),
            user: users[j]._id,
          });

          chatsPromises.push(chatsPromises.push(chat));
        }

        const chats: Chat[] = await Promise.all(chatsPromises);

        // console.log({ chats });

        const chatRoom = this.chatRoomModel.create({
          name: `Chat Room ${faker.person.jobType()}`,
          participants: users,
          chats: chats.map((chat) => chat._id).filter((chatId) => chatId),
        });

        chatRoomsPromises.push(chatRoom);
      }

      chatRooms = await Promise.all(chatRoomsPromises);
    }

    this.logger.log(
      `ChatRooms generated`,
      chatRooms.map((chatRoom) => chatRoom.name),
    );
  }

  async isChatBelongsToUser({
    chatId,
    userId,
  }: {
    chatId: ObjectId | string;
    userId: ObjectId | string;
  }) {
    const count = await this.chatModel.count({ _id: chatId, user: userId });
    return !!count;
  }

  async deleteChat(chatId: ObjectId | string) {
    return await this.chatModel.findOneAndDelete({ _id: chatId });
  }
}
