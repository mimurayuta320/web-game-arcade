import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CloudService } from './cloud.service';

@Controller('api')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Post('auth/register')
  authRegister(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.register(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('auth/login')
  authLogin(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.login(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('profile/load')
  profileLoad(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.loadProfile(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('profile/save')
  profileSave(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.saveProfile(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('match/record')
  recordMatch(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.recordMatch(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/list')
  listFriends(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.listFriends(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/remove')
  removeFriend(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.removeFriend(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/send')
  sendRequest(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.sendFriendRequest(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/incoming')
  incomingRequests(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.listIncomingFriendRequests(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/outgoing')
  outgoingRequests(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.listOutgoingFriendRequests(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/approve')
  approveRequest(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.approveFriendRequest(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/reject')
  rejectRequest(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.rejectFriendRequest(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/request/cancel')
  cancelRequest(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.cancelFriendRequest(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('friends/search')
  searchUsers(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.searchUsers(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('inquiry/list')
  listInquiries(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.listInquiries(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  @Post('inquiry/delete')
  deleteInquiry(@Body() body: Record<string, unknown>) {
    const result = this.cloudService.deleteInquiry(body);
    if (!result.ok) {
      this.throwFailure(result.code, result.message);
    }
    return result.payload;
  }

  private throwFailure(code: string, message: string) {
    const status = this.statusByCode(code);
    throw new HttpException({ ok: false, code, message }, status);
  }

  private statusByCode(code: string): number {
    if (code === 'AUTH_REQUIRED') return HttpStatus.BAD_REQUEST;
    if (code === 'USER_NOT_FOUND') return HttpStatus.NOT_FOUND;
    if (code === 'INVALID_PASSWORD') return HttpStatus.UNAUTHORIZED;
    if (code === 'USER_ALREADY_EXISTS') return HttpStatus.CONFLICT;
    if (code === 'FRIEND_NOT_FOUND') return HttpStatus.NOT_FOUND;
    if (code === 'REQUEST_NOT_FOUND') return HttpStatus.NOT_FOUND;
    if (code === 'NOT_FOUND') return HttpStatus.NOT_FOUND;
    return HttpStatus.BAD_REQUEST;
  }
}
