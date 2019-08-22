import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { createTranslateLoader } from '../../../../../lib/translation.factory';
import { HeaderComponent } from '../../../../header/header/header.component';
import { LivePreviewComponent } from '../../../../live-preview/live-preview/live-preview.component';
import { ConnectionMockService } from '../../../../service/connection/connection.mock.service';
import { ConnectionService } from '../../../../service/connection/connection.service';
import { FooterBarService } from '../../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../../service/header-label/header-label.service';
import { QuestionTextService } from '../../../../service/question-text/question-text.service';
import { QuizMockService } from '../../../../service/quiz/quiz-mock.service';
import { QuizService } from '../../../../service/quiz/quiz.service';
import { SettingsService } from '../../../../service/settings/settings.service';
import { SharedService } from '../../../../service/shared/shared.service';
import { IndexedDbService } from '../../../../service/storage/indexed.db.service';
import { StorageService } from '../../../../service/storage/storage.service';
import { StorageServiceMock } from '../../../../service/storage/storage.service.mock';
import { TrackingMockService } from '../../../../service/tracking/tracking.mock.service';
import { TrackingService } from '../../../../service/tracking/tracking.service';
import { SharedModule } from '../../../../shared/shared.module';
import { AnsweroptionsDefaultComponent } from './answeroptions-default/answeroptions-default.component';
import { AnsweroptionsFreetextComponent } from './answeroptions-freetext/answeroptions-freetext.component';
import { AnsweroptionsRangedComponent } from './answeroptions-ranged/answeroptions-ranged.component';

import { AnsweroptionsComponent } from './answeroptions.component';

class MockRouter {
  public params = {
    subscribe: (cb) => {
      cb({
        questionIndex: 0,
      });
    },
  };
}


describe('AnsweroptionsComponent', () => {
  let component: AnsweroptionsComponent;
  let fixture: ComponentFixture<AnsweroptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule, SharedModule, RouterTestingModule, HttpClientModule, TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [HttpClient],
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler,
          },
        }), NgbModalModule,
      ],
      providers: [
        IndexedDbService, {
          provide: StorageService,
          useClass: StorageServiceMock,
        }, {
          provide: QuizService,
          useClass: QuizMockService,
        }, HeaderLabelService, FooterBarService, SettingsService, {
          provide: ConnectionService,
          useClass: ConnectionMockService,
        }, {
          provide: ActivatedRoute,
          useClass: MockRouter,
        }, SharedService, QuestionTextService, {
          provide: TrackingService,
          useClass: TrackingMockService,
        },
      ],
      declarations: [
        HeaderComponent,
        LivePreviewComponent,
        AnsweroptionsDefaultComponent,
        AnsweroptionsFreetextComponent,
        AnsweroptionsRangedComponent,
        AnsweroptionsComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AnsweroptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should contain a TYPE reference', async(() => {
    expect(AnsweroptionsComponent.TYPE).toEqual('AnsweroptionsComponent');
  }));
});
