import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IMessage } from 'arsnova-click-v2-types/src/common';
import { COMMUNICATION_PROTOCOL } from 'arsnova-click-v2-types/src/communication_protocol';
import { MemberApiService } from '../../../service/api/member/member-api.service';
import { AttendeeService } from '../../../service/attendee/attendee.service';
import { ConnectionService } from '../../../service/connection/connection.service';
import { CurrentQuizService } from '../../../service/current-quiz/current-quiz.service';
import { FooterBarService } from '../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../service/header-label/header-label.service';
import { QuestionTextService } from '../../../service/question-text/question-text.service';
import { StorageService } from '../../../service/storage/storage.service';
import { DB_TABLE, STORAGE_KEY } from '../../../shared/enums';

@Component({
  selector: 'app-reading-confirmation',
  templateUrl: './reading-confirmation.component.html',
  styleUrls: ['./reading-confirmation.component.scss'],
})
export class ReadingConfirmationComponent implements OnInit {
  public static TYPE = 'ReadingConfirmationComponent';

  public questionIndex: number;
  public questionText: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private connectionService: ConnectionService,
    private attendeeService: AttendeeService,
    private router: Router,
    private currentQuizService: CurrentQuizService,
    private questionTextService: QuestionTextService,
    private sanitizer: DomSanitizer,
    private headerLabelService: HeaderLabelService,
    private footerBarService: FooterBarService,
    private memberApiService: MemberApiService,
    private storageService: StorageService,
  ) {

    this.footerBarService.TYPE_REFERENCE = ReadingConfirmationComponent.TYPE;
    headerLabelService.headerLabel = 'component.liveResults.reading_confirmation';
    this.questionIndex = currentQuizService.questionIndex;
    this.footerBarService.replaceFooterElements([]);
  }

  public sanitizeHTML(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`${value}`);
  }

  public async ngOnInit(): Promise<void> {
    await this.connectionService.initConnection();
    this.connectionService.authorizeWebSocket(this.currentQuizService.quiz.hashtag);
    this.handleMessages();
    this.questionTextService.eventEmitter.subscribe((value: string) => {
      this.questionText = value;
    });
    await this.questionTextService.change(this.currentQuizService.currentQuestion().questionText);
  }

  public async confirmReading(): Promise<void> {
    this.memberApiService.putReadingConfirmationValue({
      quizName: this.currentQuizService.quiz.hashtag,
      nickname: await this.storageService.read(DB_TABLE.CONFIG, STORAGE_KEY.NICK).toPromise(),
      questionIndex: this.questionIndex,
    }).subscribe(() => {
      this.router.navigate(['/quiz', 'flow', 'results']);
    });
  }

  private handleMessages(): void {
    this.connectionService.socket.subscribe((data: IMessage) => {
      switch (data.step) {
        case COMMUNICATION_PROTOCOL.QUIZ.START:
          this.router.navigate(['/quiz', 'flow', 'voting']);
          break;
        case COMMUNICATION_PROTOCOL.MEMBER.UPDATED_RESPONSE:
          console.log('modify response data for nickname in reading confirmation view', data.payload.nickname);
          this.attendeeService.modifyResponse(data.payload.nickname);
          break;
        case COMMUNICATION_PROTOCOL.QUIZ.RESET:
          this.attendeeService.clearResponses();
          this.currentQuizService.questionIndex = 0;
          this.router.navigate(['/quiz', 'flow', 'lobby']);
          break;
        case COMMUNICATION_PROTOCOL.LOBBY.CLOSED:
          this.router.navigate(['/']);
          break;
      }
    });
  }

}
