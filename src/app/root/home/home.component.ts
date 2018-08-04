import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefaultAnswerOption } from 'arsnova-click-v2-types/dist/answeroptions/answeroption_default';
import { IMessage } from 'arsnova-click-v2-types/dist/common';
import { COMMUNICATION_PROTOCOL } from 'arsnova-click-v2-types/dist/communication_protocol';
import { IQuestionGroup } from 'arsnova-click-v2-types/dist/questions/interfaces';
import { ABCDSingleChoiceQuestion } from 'arsnova-click-v2-types/dist/questions/question_choice_single_abcd';
import { questionGroupReflection } from 'arsnova-click-v2-types/dist/questions/questionGroup_reflection';
import { SessionConfiguration } from 'arsnova-click-v2-types/dist/session_configuration/session_config';
import { Observable, Subscription } from 'rxjs';
import { DefaultSettings } from '../../../lib/default.settings';
import { AvailableQuizzesComponent } from '../../modals/available-quizzes/available-quizzes.component';
import { ActiveQuestionGroupService } from '../../service/active-question-group/active-question-group.service';
import { LobbyApiService } from '../../service/api/lobby/lobby-api.service';
import { QuizApiService } from '../../service/api/quiz/quiz-api.service';
import { AttendeeService } from '../../service/attendee/attendee.service';
import { ConnectionService } from '../../service/connection/connection.service';
import { CurrentQuizService } from '../../service/current-quiz/current-quiz.service';
import { FooterBarService } from '../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../service/header-label/header-label.service';
import { I18nService } from '../../service/i18n/i18n.service';
import { CasLoginService } from '../../service/login/cas-login.service';
import { SettingsService } from '../../service/settings/settings.service';
import { SharedService } from '../../service/shared/shared.service';
import { StorageService } from '../../service/storage/storage.service';
import { ThemesService } from '../../service/themes/themes.service';
import { ITrackClickEvent, TrackingService } from '../../service/tracking/tracking.service';
import { UserService } from '../../service/user/user.service';
import { DB_TABLE, LANGUAGE, STORAGE_KEY, USER_AUTHORIZATION } from '../../shared/enums';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public static TYPE = 'HomeComponent';
  public canJoinQuiz = false;
  public canAddQuiz = false;
  public canEditQuiz = false;
  public canStartQuiz = false;
  public passwordRequired = false;
  public isAddingDemoQuiz = false;
  public isAddingABCDQuiz = false;
  public enteredSessionName = '';

  private _provideNickSelection = false;

  get provideNickSelection(): boolean {
    return this._provideNickSelection;
  }

  private _serverPassword = '';

  get serverPassword(): string {
    return this._serverPassword;
  }

  private _hasErrors = '';

  get hasErrors(): string {
    return this._hasErrors;
  }

  private _isShowingQuiznameDatalist = false;

  get isShowingQuiznameDatalist(): boolean {
    return this._isShowingQuiznameDatalist;
  }

  set isShowingQuiznameDatalist(value: boolean) {
    this._isShowingQuiznameDatalist = value;
  }

  private _ownQuizzes: Array<string> = [];

  get ownQuizzes(): Array<string> {
    return this._ownQuizzes;
  }

  private _routerSubscription: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private footerBarService: FooterBarService,
    private headerLabelService: HeaderLabelService,
    private modalService: NgbModal,
    private activeQuestionGroupService: ActiveQuestionGroupService,
    private currentQuizService: CurrentQuizService,
    private router: Router,
    private themesService: ThemesService,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private attendeeService: AttendeeService,
    private connectionService: ConnectionService,
    private sanitizer: DomSanitizer,
    private casService: CasLoginService,
    private settingsService: SettingsService,
    private trackingService: TrackingService,
    private quizApiService: QuizApiService,
    private lobbyApiService: LobbyApiService,
    private storageService: StorageService,
    private userService: UserService,
    public sharedService: SharedService,
  ) {

    this.footerBarService.TYPE_REFERENCE = HomeComponent.TYPE;

    headerLabelService.headerLabel = 'default';

    if (isPlatformBrowser(this.platformId)) {
      this.storageService.getAllQuiznames().then(val => {
        this._ownQuizzes = val;
        if (this._ownQuizzes.length) {
          this.modalService.open(AvailableQuizzesComponent);
        }
      });

      this.cleanUpSessionStorage();
    }

    this.storageService.read(DB_TABLE.CONFIG, STORAGE_KEY.PRIVATE_KEY).subscribe(val => {
      if (!val) {
        this.storageService.create(DB_TABLE.CONFIG, STORAGE_KEY.PRIVATE_KEY, this.activeQuestionGroupService.generatePrivateKey()).subscribe();
      }
    });

    this.updateFooterElements(this.userService.isLoggedIn);
    this.userService.loginNotifier.subscribe(isLoggedIn => {
      this.updateFooterElements(isLoggedIn);
    });

    this.connectionService.initConnection().then(() => {
      if (!this.connectionService.socket) {
        return;
      }

      this.connectionService.socket.subscribe(data => {
        this.connectionService.websocketAvailable = true;
      }, () => this.connectionService.websocketAvailable = false);
    });
  }

  public sanitizeHTML(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`${value}`);
  }

  public ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      console.log('homecomponent ngoninit - isserver');
      return;
    }
    console.log('homecomponent ngoninit - isclient');

    this._routerSubscription = this.route.params.subscribe(async params => {
      if (!Object.keys(params).length || !params.themeId || !params.languageId) {
        const theme = this.storageService.read(DB_TABLE.CONFIG, STORAGE_KEY.DEFAULT_THEME).toPromise();

        if (theme) {
          return;
        }

        await this.storageService.create(DB_TABLE.CONFIG, STORAGE_KEY.DEFAULT_THEME, DefaultSettings.defaultQuizSettings.theme).toPromise();
        this.themesService.updateCurrentlyUsedTheme();

        return;
      }

      await this.storageService.create(DB_TABLE.CONFIG, STORAGE_KEY.DEFAULT_THEME, params.themeId).toPromise();
      this.i18nService.setLanguage(<LANGUAGE>params.languageId.toUpperCase());
      this.themesService.updateCurrentlyUsedTheme();
    });
  }

  public ngOnDestroy(): void {
    if (this._routerSubscription) {
      this._routerSubscription.unsubscribe();
    }
  }

  public autoJoinToSession(quizname): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.selectQuizByList(quizname);

    this.router.navigate(['/quiz', quizname]);
  }

  public showQuiznameDatalist(): void {
    if (isPlatformBrowser(this.platformId)) {
      const elem = document.getElementById('hashtag-input-data-list');

      if (elem) {
        elem.classList.remove('d-none');
      }
    }
    this.isShowingQuiznameDatalist = true;
  }

  public hideQuiznameDatalist(): void {
    if (isPlatformBrowser(this.platformId)) {
      const elem = document.getElementById('hashtag-input-data-list');

      if (elem) {
        elem.classList.add('d-none');
      }
    }
    this.isShowingQuiznameDatalist = false;
  }

  public selectQuizByList(quizName: string): void {
    this.hideQuiznameDatalist();
    this.selectQuizByName(quizName);
  }

  public parseQuiznameInput(event: any): void {
    this.selectQuizByName(event.target.value.trim());
  }

  public setPassword(event: Event): void {
    this._serverPassword = (
      <HTMLInputElement>event.target
    ).value;
  }

  public handleClick(id: string): boolean {
    const trackingParams: ITrackClickEvent = {
      action: HomeComponent.TYPE,
      label: '',
      customDimensions: {
        dimension1: this.hasErrors,
        dimension2: this.passwordRequired,
      },
    };

    switch (id) {
      case 'joinSession':
        trackingParams.label = 'join-session';
        break;
      case 'addSession':
        trackingParams.label = 'add-session';
        break;
      case 'editSession':
        trackingParams.label = 'edit-session';
        break;
      case 'add-demo-quiz':
        trackingParams.label = 'add-demo-quiz';
        break;
      case 'add-abcd-quiz':
        trackingParams.label = 'add-abcd-quiz';
        break;
    }

    this.trackingService.trackClickEvent(trackingParams);

    return true;
  }

  public async setActiveQuestionGroup(routingTarget?: Array<string>): Promise<boolean> {
    if (isPlatformBrowser(this.platformId)) {
      const questionGroupSerialized = await this.storageService.read(DB_TABLE.QUIZ, this.enteredSessionName).toPromise();
      if (questionGroupSerialized) {
        this.activeQuestionGroupService.activeQuestionGroup = questionGroupReflection[questionGroupSerialized.TYPE](questionGroupSerialized);
      }
    }

    if (routingTarget) {
      this.router.navigate(routingTarget);
    }

    return true;
  }

  public async setAsCurrentQuiz(routingTarget: Array<string>): Promise<void> {
    if (isPlatformServer(this.platformId)) {
      return null;
    }

    if (this.passwordRequired && !(
        this._serverPassword && this._serverPassword.length
    )) {
      return;
    }

    const questionGroupSerialized = await this.storageService.read(DB_TABLE.QUIZ, this.enteredSessionName).toPromise();
    const questionGroup = await new Promise<IQuestionGroup>((resolve) => {
      if (this.isAddingDemoQuiz) {
        this.addDemoQuiz().then(value => resolve(value));
      } else if (this.isAddingABCDQuiz) {
        this.addAbcdQuiz().then(value => resolve(value));
      } else if (questionGroupSerialized) {
        resolve(questionGroupReflection[questionGroupSerialized.TYPE](questionGroupSerialized));
      } else {
        resolve(questionGroupReflection.DefaultQuestionGroup({
          hashtag: this.enteredSessionName,
          sessionConfig: new SessionConfiguration(DefaultSettings.defaultQuizSettings),
        }));
      }
    });

    this.reserveQuiz(questionGroup, routingTarget);
  }

  private updateFooterElements(isLoggedIn: boolean): void {
    const footerElements = [
      this.footerBarService.footerElemAbout,
      this.footerBarService.footerElemTranslation,
      this.footerBarService.footerElemTheme,
      this.footerBarService.footerElemFullscreen,
      this.footerBarService.footerElemHashtagManagement,
      this.footerBarService.footerElemImport,
    ];

    if (isLoggedIn) {
      if (this.userService.isAuthorizedFor(USER_AUTHORIZATION.EDIT_I18N)) {
        footerElements.push(this.footerBarService.footerElemEditI18n);
      }
      footerElements.push(this.footerBarService.footerElemLogout);

    } else {
      footerElements.push(this.footerBarService.footerElemLogin);

    }

    this.footerBarService.replaceFooterElements(footerElements);
  }

  private async reserveQuiz(questionGroup: IQuestionGroup, routingTarget: Array<string>): Promise<void> {
    this.quizApiService.postQuizReservation({
      quizName: this.enteredSessionName,
      privateKey: await this.storageService.read(DB_TABLE.CONFIG, STORAGE_KEY.PRIVATE_KEY).toPromise(),
      serverPassword: this._serverPassword,
    }).subscribe(async value => {

      if (value.status === COMMUNICATION_PROTOCOL.STATUS.SUCCESSFUL) {
        this.activeQuestionGroupService.activeQuestionGroup = questionGroup;
        this.activeQuestionGroupService.persist();

        this.currentQuizService.quiz = questionGroup;
        this.currentQuizService.persistToSessionStorage();

        if (this.isAddingABCDQuiz) {
          this.trackingService.trackConversionEvent({
            action: HomeComponent.TYPE,
            label: 'ABCD Quiz created',
          });
        } else if (this.isAddingDemoQuiz) {
          this.trackingService.trackConversionEvent({
            action: HomeComponent.TYPE,
            label: 'Demo Quiz created',
          });
        }

        await this.activateQuiz(questionGroup).toPromise();

        this.router.navigate(routingTarget);

      } else {

        if (value.step === COMMUNICATION_PROTOCOL.QUIZ.TOO_MUCH_ACTIVE_QUIZZES) {
          this._hasErrors = 'plugins.splashscreen.error.error_messages.too_much_active_quizzes';
        } else if (value.step === COMMUNICATION_PROTOCOL.QUIZ.SERVER_PASSWORD_REQUIRED) {
          this._hasErrors = 'plugins.splashscreen.error.error_messages.server_password_required';
        } else if (value.step === COMMUNICATION_PROTOCOL.AUTHORIZATION.INSUFFICIENT_PERMISSIONS) {
          this._hasErrors = 'plugins.splashscreen.error.error_messages.server_password_invalid';
        } else {
          console.log(value);
        }
      }
    });
  }

  private selectQuizByName(quizName: string): void {
    this.enteredSessionName = quizName;
    this.canJoinQuiz = false;
    this.canAddQuiz = false;
    this.canEditQuiz = false;
    this.canStartQuiz = false;
    this.passwordRequired = false;
    this.isAddingDemoQuiz = false;
    this.isAddingABCDQuiz = false;

    if (isPlatformServer(this.platformId)) {
      return;
    }

    if (this.ownQuizzes.find(quiz => quiz === quizName.toLowerCase())) {
      this.selectQuizAsExisting(quizName);
    } else if (quizName.toLowerCase() === 'demo quiz') {
      this.selectQuizAsDemoQuiz();
    } else if (this.checkABCDOrdering(quizName.toLowerCase())) {
      this.selectQuizAsAbcdQuiz();
    } else {
      if (quizName.length > 3) {
        this.selectQuizAsDefaultQuiz(quizName);
      }
    }
  }

  private async selectQuizAsExisting(quizname): Promise<void> {
    const currentQuiz = await this.storageService.read(DB_TABLE.QUIZ, quizname).toPromise();
    const questionGroupInstance = questionGroupReflection[currentQuiz.TYPE](currentQuiz);

    this.canAddQuiz = false;
    this.canEditQuiz = true;
    this.canStartQuiz = !this.settingsService.serverSettings.createQuizPasswordRequired && questionGroupInstance.isValid();
    this.passwordRequired = this.canStartQuiz && this.settingsService.serverSettings.createQuizPasswordRequired;
  }

  private selectQuizAsDemoQuiz(): void {
    this.isAddingDemoQuiz = true;
    this.canAddQuiz = false;
    this.canEditQuiz = false;
    this.canStartQuiz = !this.settingsService.serverSettings.createQuizPasswordRequired;
    this.passwordRequired = this.settingsService.serverSettings.createQuizPasswordRequired;
  }

  private selectQuizAsAbcdQuiz(): void {
    this.isAddingABCDQuiz = true;
    this.canAddQuiz = false;
    this.canEditQuiz = false;
    this.canStartQuiz = !this.settingsService.serverSettings.createQuizPasswordRequired;
    this.passwordRequired = this.settingsService.serverSettings.createQuizPasswordRequired;
  }

  private selectQuizAsDefaultQuiz(quizName: string): void {
    this.quizApiService.getQuizStatus(quizName).subscribe(value => {
      if (value.status === COMMUNICATION_PROTOCOL.STATUS.SUCCESSFUL) {
        switch (value.step) {
          case COMMUNICATION_PROTOCOL.QUIZ.EXISTS:
            this.canAddQuiz = false;
            this.canJoinQuiz = false;
            this.passwordRequired = false;
            this.canStartQuiz = false;
            break;
          case COMMUNICATION_PROTOCOL.QUIZ.AVAILABLE:
            this.canAddQuiz = false;
            this.canJoinQuiz = true;
            this.passwordRequired = false;
            this.canStartQuiz = false;
            this._provideNickSelection = value.payload.provideNickSelection;
            this.casService.casLoginRequired = value.payload.authorizeViaCas;
            if (this.casService.casLoginRequired) {
              this.casService.quizName = quizName;
            }
            break;
          case COMMUNICATION_PROTOCOL.QUIZ.UNDEFINED:
            this.canAddQuiz = true;
            this.canJoinQuiz = false;
            this.passwordRequired = this.settingsService.serverSettings.createQuizPasswordRequired;
            this.canStartQuiz = !this.settingsService.serverSettings.createQuizPasswordRequired;
            break;
          default:
            console.log(value);
        }
      }
    });
  }

  private cleanUpSessionStorage(): void {
    if (this.activeQuestionGroupService.activeQuestionGroup) {
      this.activeQuestionGroupService.cleanUp();
    }
    if (isPlatformBrowser(this.platformId)) {
      this.storageService.delete(DB_TABLE.CONFIG, STORAGE_KEY.QUIZ_THEME).subscribe();
    }
    this.attendeeService.cleanUp();
    this.currentQuizService.cleanUp();
    this.connectionService.cleanUp();
  }

  private checkABCDOrdering(hashtag: string): boolean {
    let ordered = true;
    if (!hashtag || hashtag.length < 2 || hashtag.charAt(0) !== 'a') {
      return false;
    }
    for (let i = 1; i < hashtag.length; i++) {
      if (hashtag.charCodeAt(i) !== hashtag.charCodeAt(i - 1) + 1) {
        ordered = false;
        break;
      }
    }
    return ordered;
  }

  private activateQuiz(questionGroup: IQuestionGroup): Observable<IMessage> {
    return this.lobbyApiService.putLobby({
      quiz: questionGroup.serialize(),
    });
  }

  private async addDemoQuiz(): Promise<IQuestionGroup> {
    const value = await this.quizApiService.generateDemoQuiz(this.i18nService.currentLanguage.toString()).toPromise();
    Object.assign(value.sessionConfig, DefaultSettings.defaultQuizSettings);
    const questionGroup = questionGroupReflection.DefaultQuestionGroup(value);
    this.enteredSessionName = questionGroup.hashtag;

    return questionGroup;
  }

  private async addAbcdQuiz(): Promise<IQuestionGroup> {
    const language = this.i18nService.currentLanguage.toString();
    const answerList = this.enteredSessionName.split('');

    if (isPlatformServer(this.platformId)) {
      return;
    }

    const hasMatchedABCDQuiz = this.ownQuizzes.filter(quizName => {
      return quizName.split(' ')[0] === this.enteredSessionName;
    });
    if (hasMatchedABCDQuiz.length) {
      const rawQuiz = await this.storageService.read(DB_TABLE.QUIZ, hasMatchedABCDQuiz[0]).toPromise();
      const questionGroup = questionGroupReflection.DefaultQuestionGroup(rawQuiz);
      const answerOptionList = (
        <Array<DefaultAnswerOption>>[]
      );

      answerList.forEach((character, index) => {
        answerOptionList.push(new DefaultAnswerOption({
          answerText: (
            String.fromCharCode(index + 65)
          ),
        }));
      });
      this.enteredSessionName = questionGroup.hashtag;
      const abcdQuestion = new ABCDSingleChoiceQuestion({
        questionText: '',
        timer: 60,
        displayAnswerText: false,
        answerOptionList,
        showOneAnswerPerRow: false,
      });
      questionGroup.questionList = [abcdQuestion];
      return questionGroup;

    } else {

      const value = await this.quizApiService.generateABCDQuiz(language, answerList.length).toPromise();
      Object.assign(value.sessionConfig, DefaultSettings.defaultQuizSettings);

      const questionGroup = questionGroupReflection.DefaultQuestionGroup(value);
      const answerOptionList = (
        <Array<DefaultAnswerOption>>[]
      );

      answerList.forEach((character, index) => {
        answerOptionList.push(new DefaultAnswerOption({
          answerText: (
            String.fromCharCode(index + 65)
          ),
        }));
      });
      this.enteredSessionName = questionGroup.hashtag;
      const abcdQuestion = new ABCDSingleChoiceQuestion({
        questionText: '',
        timer: 60,
        displayAnswerText: false,
        answerOptionList,
        showOneAnswerPerRow: false,
      });
      questionGroup.questionList = [abcdQuestion];
      return questionGroup;
    }
  }
}
