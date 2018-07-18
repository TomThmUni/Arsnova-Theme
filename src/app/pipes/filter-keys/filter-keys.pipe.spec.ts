import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { I18nManagerApiService } from '../../service/api/i18n-manager/i18n-manager-api.service';
import { LanguageLoaderService } from '../../service/language-loader/language-loader.service';
import { ProjectLoaderService } from '../../service/project-loader/project-loader.service';
import { IndexedDbService } from '../../service/storage/indexed.db.service';
import { StorageService } from '../../service/storage/storage.service';
import { StorageServiceMock } from '../../service/storage/storage.service.mock';
import { UserService } from '../../service/user/user.service';
import { FilterKeysPipe } from './filter-keys.pipe';

describe('FilterKeysPipe', () => {
  let pipe: FilterKeysPipe;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        LanguageLoaderService, I18nManagerApiService, ProjectLoaderService, UserService, IndexedDbService, {
          provide: StorageService,
          useClass: StorageServiceMock,
        },
      ],
      declarations: [
        FilterKeysPipe,
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    pipe = new FilterKeysPipe(TestBed.get(LanguageLoaderService));
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
