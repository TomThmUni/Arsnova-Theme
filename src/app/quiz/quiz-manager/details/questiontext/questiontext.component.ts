import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DEVICE_TYPES, LIVE_PREVIEW_ENVIRONMENT } from '../../../../../environments/environment';
import { QuizPoolApiService } from '../../../../service/api/quiz-pool/quiz-pool-api.service';
import { FooterBarService } from '../../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../../service/header-label/header-label.service';
import { QuestionTextService } from '../../../../service/question-text/question-text.service';
import { QuizService } from '../../../../service/quiz/quiz.service';
import { AbstractQuizManagerDetailsComponent } from '../abstract-quiz-manager-details.component';

@Component({
  selector: 'app-questiontext',
  templateUrl: './questiontext.component.html',
  styleUrls: ['./questiontext.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestiontextComponent extends AbstractQuizManagerDetailsComponent implements OnInit, OnDestroy {
  public static TYPE = 'QuestiontextComponent';

  @ViewChild('questionText', { static: true }) private textarea: ElementRef;

  public readonly DEVICE_TYPE = DEVICE_TYPES;
  public readonly ENVIRONMENT_TYPE = LIVE_PREVIEW_ENVIRONMENT;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    headerLabelService: HeaderLabelService,
    quizService: QuizService,
    footerBarService: FooterBarService,
    route: ActivatedRoute,
    router: Router,
    quizPoolApiService: QuizPoolApiService,
    private questionTextService: QuestionTextService,
    private cd: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    super(platformId, quizService, headerLabelService, footerBarService, quizPoolApiService, router, route);

    footerBarService.TYPE_REFERENCE = QuestiontextComponent.TYPE;
    footerBarService.replaceFooterElements([
      footerBarService.footerElemBack,
    ]);
  }

  public connector(markdownFeature: string): void {
    switch (markdownFeature) {
      case 'boldMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('**', '**')) {
          this.insertInQuestionText('**', '**');
        }
        break;
      case 'strikeThroughMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('~~', '~~')) {
          this.insertInQuestionText('~~', '~~');
        }
        break;
      case 'italicMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('*', '*')) {
          this.insertInQuestionText('', '*');
        }
        break;
      case 'headerMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('### ', '')) {
          if (this.markdownAlreadyExistsAndAutoRemove('## ', '')) {
            this.insertInQuestionText('### ', '');
          } else {
            if (this.markdownAlreadyExistsAndAutoRemove('# ', '')) {
              this.insertInQuestionText('## ', '');
            } else {
              this.insertInQuestionText('# ', '');
            }
          }
        }
        break;
      case 'hyperlinkMarkdownButton':
        this.wrapWithLinkSymbol();
        break;
      case 'imageMarkdownButton':
        this.wrapWithImageSymbol();
        break;
      case 'codeMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('```\n', '\n```')) {
          this.insertInQuestionText('```\n', '\n```');
        }
        break;
      case 'ulMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('- ')) {
          this.insertInQuestionText('- ');
        }
        break;
      case 'latexMarkdownButton':
        if (!this.markdownAlreadyExistsAndAutoRemove('$$', '$$')) {
          if (!this.markdownAlreadyExistsAndAutoRemove('$', '$')) {
            this.insertInQuestionText('$$', '$$');
          }
        } else {
          this.insertInQuestionText('$', '$');
        }
        break;
    }

    this.questionTextService.change(this.textarea.nativeElement.value).subscribe(() => this.cd.markForCheck());
  }

  public fireEvent(event: Event): void {
    this.questionTextService.change((
      <HTMLTextAreaElement>event.target
    ).value).subscribe(() => this.cd.markForCheck());
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this.quizService.quizUpdateEmitter.pipe( //
      distinctUntilChanged(), //
      takeUntil(this.destroy), //
    ).subscribe(() => {
      if (!this.quizService.quiz) {
        return;
      }

      this.textarea.nativeElement.value = this.quizService.quiz.questionList[this._questionIndex].questionText;
      this.questionTextService.change(this.quizService.quiz.questionList[this._questionIndex].questionText).subscribe(() => this.cd.markForCheck());
    });

    const contentContainer = this.document.getElementById('content-container');

    if (contentContainer) {
      contentContainer.classList.remove('container');
      contentContainer.classList.add('container-fluid');
    }
  }

  @HostListener('window:beforeunload', [])
  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this.questionTextService.change(this.textarea.nativeElement.value).subscribe();

    if (this.quizService.quiz) {
      this.quizService.quiz.questionList[this._questionIndex].questionText = this.textarea.nativeElement.value;
      this.quizService.persist();
    }

    if (isPlatformBrowser(this.platformId)) {
      const contentContainer = this.document.getElementById('content-container');

      if (contentContainer) {
        contentContainer.classList.add('container');
        contentContainer.classList.remove('container-fluid');
      }
    }
  }

  private wrapWithLinkSymbol(): void {
    const selectionStart = this.textarea.nativeElement.selectionStart;
    const selectionEnd = this.textarea.nativeElement.selectionEnd;
    const pre = this.textarea.nativeElement.value.substr(0, selectionStart - length);
    const selected = this.textarea.nativeElement.value.substring(selectionStart, selectionEnd);
    const post = this.textarea.nativeElement.value.substr(selectionEnd + length, this.textarea.nativeElement.value.length);

    this.textarea.nativeElement.value = `${pre}[${selected}](${selected})${post}`;
  }

  private wrapWithImageSymbol(): void {
    const selectionStart = this.textarea.nativeElement.selectionStart;
    const selectionEnd = this.textarea.nativeElement.selectionEnd;
    const pre = this.textarea.nativeElement.value.substr(0, selectionStart - length);
    const selected = this.textarea.nativeElement.value.substring(selectionStart, selectionEnd);
    const post = this.textarea.nativeElement.value.substr(selectionEnd + length, this.textarea.nativeElement.value.length);

    this.textarea.nativeElement.value = `${pre}![${selected}](${selected})${post}`;
  }

  private insertInQuestionText(textStart, textEnd?): void {
    textEnd = typeof textEnd !== 'undefined' ? textEnd : '';

    const scrollPos = this.textarea.nativeElement.scrollTop;
    const strPosBegin = this.textarea.nativeElement.selectionStart;
    const strPosEnd = this.textarea.nativeElement.selectionEnd;
    const frontText = (
      this.textarea.nativeElement.value
    ).substring(0, strPosBegin);
    const backText = (
      this.textarea.nativeElement.value
    ).substring(strPosEnd, this.textarea.nativeElement.value.length);
    const selectedText = (
      this.textarea.nativeElement.value
    ).substring(strPosBegin, strPosEnd);

    this.textarea.nativeElement.value = frontText + textStart + selectedText + textEnd + backText;
    this.textarea.nativeElement.selectionStart = strPosBegin + textStart.length;
    this.textarea.nativeElement.selectionEnd = strPosEnd + textStart.length;
    this.textarea.nativeElement.focus();
    this.textarea.nativeElement.scrollTop = scrollPos;
  }

  private markdownAlreadyExistsAndAutoRemove(textStart, textEnd?): boolean {

    // fix for IE / Edge: get dismissed focus back to retrieve selection values
    this.textarea.nativeElement.focus();

    const scrollPos = this.textarea.nativeElement.scrollTop;
    const strPosBegin = this.textarea.nativeElement.selectionStart;
    const strPosEnd = this.textarea.nativeElement.selectionEnd;

    textEnd = typeof textEnd !== 'undefined' ? textEnd : '';
    let textEndExists = false;
    let textStartExists = false;

    if (textEnd.length > 0) {
      if ((
            this.textarea.nativeElement.value
          ).substring(strPosEnd, strPosEnd + textEnd.length) === textEnd) {
        textEndExists = true;
      }
    } else {
      textEndExists = true;
    }

    if ((
          this.textarea.nativeElement.value
        ).substring(strPosBegin - textStart.length, strPosBegin) === textStart) {
      textStartExists = true;
    }

    if (textStartExists && textEndExists) {
      const frontText = (
        this.textarea.nativeElement.value
      ).substring(0, strPosBegin - textStart.length);
      const middleText = (
        this.textarea.nativeElement.value
      ).substring(strPosBegin, strPosEnd);
      const backText = (
        this.textarea.nativeElement.value
      ).substring(strPosEnd + textEnd.length, this.textarea.nativeElement.value.length);

      this.textarea.nativeElement.value = frontText + middleText + backText;
      this.textarea.nativeElement.selectionStart = strPosBegin - textStart.length;
      this.textarea.nativeElement.selectionEnd = strPosEnd - (
        textEnd.length === 0 ? textStart.length : textEnd.length
      );
      this.textarea.nativeElement.focus();
      this.textarea.nativeElement.scrollTop = scrollPos;

      return true;
    }
    return false;
  }

}
