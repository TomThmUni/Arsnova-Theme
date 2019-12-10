import { Injectable } from '@angular/core';
import { CanActivate, CanLoad } from '@angular/router';
import { DefaultSettings } from '../../lib/default.settings';
import { StatusProtocol } from '../../lib/enums/Message';
import { QuizApiService } from '../api/quiz/quiz-api.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class CasLoginService implements CanLoad, CanActivate {

  public casLoginRequired = false;
  public quizName = '';
  public ticket: string = null;

  constructor(private userService: UserService, private quizApiService: QuizApiService) {
  }

  public canActivate(): Promise<boolean> {
    return this.canLoad();
  }

  public async canLoad(): Promise<boolean> {
    if (this.userService.isLoggedIn || !this.casLoginRequired) {
      return true;
    }

    if (this.ticket) {
      return await this.userService.authenticateThroughCas(this.ticket);
    }

    if (!this.quizName) {
      this.navigateToAuthorize();
      return false;
    }

    const data = await this.quizApiService.getQuizStatus(this.quizName).toPromise();
    if (data.status !== StatusProtocol.Success) {
      return true;
    }

    if (data.payload.authorizeViaCas) {
      this.navigateToAuthorize();
      return false;
    }

    return true;
  }

  public navigateToAuthorize(): void {
    location.href = `${DefaultSettings.httpLibEndpoint}/authorize`;
  }
}
