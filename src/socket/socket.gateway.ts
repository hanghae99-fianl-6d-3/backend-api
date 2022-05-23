import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { ChatRoomService } from 'src/chatroom/chatroom.service';
import { ChatUserService } from 'src/chatuser/chatuser.service';
import { ClientService } from 'src/client/client.service';
import { ConnectDto } from './dto/auth-connect.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { DeleteChatDto } from './dto/delete-chat.dto';
import { EnterChatRoomDto } from './dto/enter-chatroom.dto';
import { LeaveChatRoomDto } from './dto/leave-chatroom.dto';
import { SelectChatsDto } from './dto/select-chats.dto';
import { EVENT } from './socket.event';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly chatRoomService: ChatRoomService,
    private readonly chatUserService: ChatUserService,
    private readonly clientService: ClientService,
  ) {}

  @WebSocketServer() server: Server;
  afterInit = async (server: Server) => server;
  handleConnection = async (client: Socket) => client;

  // (완료) 소켓 연결 정보 삭제
  handleDisconnect = async (client: Socket) =>
    await this.clientService.disConnect(client.id);

  // (완료) 사용자 소켓 연결 및 소켓 연결 정보 저장
  @SubscribeMessage(EVENT.CONNECT.ON)
  async onConnect(
    @MessageBody() connectDto: ConnectDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = connectDto;
    await this.clientService.connect(userId, client.id);
    return client.emit(EVENT.CONNECT.EMIT, 'connected');
  }

  // 참여중인 채팅방 조회
  @SubscribeMessage(EVENT.GET_CHATROOMS.ON)
  async getChatRooms(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const rooms = await this.chatUserService.findUserChatRooms(userId);

    client.emit(EVENT.GET_CHATROOMS.EMIT, rooms);
    return;
  }

  // 채팅방 입장 (채팅방 목록)
  @SubscribeMessage(EVENT.ENTER_ROOM_LIST.ON)
  async enterChatRoomByList(
    @MessageBody() enterChatRoomDto: EnterChatRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = enterChatRoomDto;
    const chats = await this.chatRoomService.enterRoomByList(roomId, userId);

    client.join(roomId);
    client.emit(EVENT.GET_CHATS.EMIT, chats);
    return;
  }

  // 채팅방 입장 (1대1 DM)
  @SubscribeMessage(EVENT.ENTER_ROOM_DM.ON)
  async enterChatRoomByDM(
    @MessageBody() enterChatRoomDto: EnterChatRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, otherId } = enterChatRoomDto;
    const chats = await this.chatRoomService.enterRoomByDM(userId, otherId);

    client.join('roomId'); // 테스트 코드; roomId 조회 후 join 예정
    client.emit(EVENT.GET_CHATS.EMIT, chats);
    return;
  }

  // 채팅방 목록에서 직접 채팅방을 나가기
  @SubscribeMessage(EVENT.LEAVE_ROOM.ON)
  async leaveChatRoom(
    @MessageBody() leaveChatRoomDto: LeaveChatRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = leaveChatRoomDto;
    const room = await this.chatRoomService.leaveChatRoom(roomId, userId);

    client.leave(roomId);
    client.emit(EVENT.LEAVE_ROOM.EMIT, room);
    return;
  }

  // 상대방과의 채팅방에서 나가는 경우
  @SubscribeMessage(EVENT.EXIT_ROOM.ON)
  async exitChatRoom(
    @MessageBody() leaveChatRoomDto: LeaveChatRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = leaveChatRoomDto;
    const room = await this.chatRoomService.exitChatRoom(roomId);

    client.leave(roomId);
    client.emit(EVENT.EXIT_ROOM.EMIT, room);
    return;
  }

  // 메시지 가져오기 (offset)
  @SubscribeMessage(EVENT.GET_CHATS.ON)
  async getChats(
    @MessageBody() selectChatsDto: SelectChatsDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, offset } = selectChatsDto;

    const chats = await this.chatService.getManyByRoomIdWithOffset(
      roomId,
      userId,
      offset,
    );

    client.emit(EVENT.GET_CHATS.EMIT, chats);
    return;
  }

  // 메시지 저장 (채팅방 생성 포함)
  @SubscribeMessage(EVENT.SEND_CHAT.ON)
  async sendChat(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, message } = createChatDto;

    const chat = await this.chatService.create(roomId, userId, message);

    // 해당 room에 어떤 socketId가 있는지?
    // this.server.sockets.adapter.rooms.get(roomId);

    // 해당 socketId가 현재 연결되어 있는지?

    // 해당 room에 없는 사람들(userId)의 socketId 조회

    // 해당 채팅방에 알림 보내주고
    this.server.to(roomId).emit(EVENT.SEND_CHAT.EMIT, chat);

    /* 채팅방에 접속하지않은 사람에게 알림을 보내준다?
    [socketId].forEach((socketId) => { 
       ->
    })
    */
    return;
  }

  // 메시지 삭제
  @SubscribeMessage(EVENT.DELETE_CHAT.ON)
  async deleteChat(
    @MessageBody() deleteChatDto: DeleteChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, chatId } = deleteChatDto;

    const chat = await this.chatService.deleteByChatId(userId, chatId);

    client.emit(EVENT.DELETE_CHAT.EMIT, chat);

    return;
  }
}
