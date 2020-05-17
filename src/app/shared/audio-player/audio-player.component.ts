import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { IAudioPlayerConfig } from '../../lib/interfaces/IAudioConfig';
import { FilesApiService } from '../../service/api/files/files-api.service';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
})
export class AudioPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  public static readonly TYPE = 'AudioPlayerComponent';

  private _autostart: boolean;
  private _hideControls: boolean;
  private _target: 'lobby' | 'countdownRunning' | 'countdownEnd';
  private _original_volume: string;
  private _src: string;
  private _loop = true;
  private _volume = '1';
  private _isPlaying = false;
  private _autostartRejected: boolean;
  private readonly audioElement: HTMLAudioElement;

  get autostartRejected(): boolean {
    return this._autostartRejected;
  }

  @Output() public volumeChange = new EventEmitter();
  @Output() public playbackFinished = new EventEmitter();

  @Input() set config(value: IAudioPlayerConfig) {
    if (!value) {
      return;
    }

    this._autostart = value.autostart ?? this._autostart;
    this._hideControls = value.hideControls ?? this._hideControls;
    this._target = value.target ?? this._target;

    if (value.original_volume) {
      this._original_volume = value.original_volume;
      this._volume = value.original_volume;
    }

    this._src = value.src ?? this._src;
    this._loop = value.loop ?? this._loop;

    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.audioElement.autoplay = this._autostart;
    this.audioElement.src = this.getUrl();
    this.audioElement.volume = (parseInt(this._volume, 10) || 0) / 100;
    this.audioElement.loop = this.loop;

    if (this._autostart) {
      this.playMusic();
    }
  }

  get hideControls(): boolean {
    return this._hideControls;
  }

  get autostart(): boolean {
    return this._autostart;
  }

  get target(): 'lobby' | 'countdownRunning' | 'countdownEnd' {
    return this._target;
  }

  get src(): string {
    return this._src;
  }

  get loop(): boolean {
    return this._loop;
  }

  get volume(): string {
    return this._volume;
  }

  set volume(value: string) {
    this._volume = value;
    this.volumeChange.emit(this.volume);
    this.audioElement.volume = (parseInt(this._volume, 10) || 0) / 100;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private filesApiService: FilesApiService) {
    if (isPlatformBrowser(this.platformId)) {
      this.audioElement = new Audio();
      this.audioElement.addEventListener('ended', () => this.playbackFinished.next());
    }
  }

  public ngOnInit(): void {
  }

  public getUrl(): string {
    return this.filesApiService.SOUND_FILE_GET_URL(this._target, this._src);
  }

  public playMusic(): void {
    this._autostartRejected = false;
    if (this.audioElement.ended) {
      this.audioElement.currentTime = 0;
    }
    this.audioElement.play().catch(() => {
      // Autoplay was prevented - "NotAllowedError: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
      this._autostartRejected = true;
    });
    this._isPlaying = true;
  }

  public pauseMusic(): void {
    this.audioElement.pause();
    this._isPlaying = false;
  }

  public stopMusic(): void {
    if (isPlatformServer(this.platformId) || !this.audioElement) {
      return;
    }

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this._isPlaying = false;
  }

  public isStopped(): boolean {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    return (!this.audioElement.currentTime && this.audioElement.paused) || this.audioElement.ended;
  }

  public ngAfterViewInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.audioElement.volume = (parseInt(this._volume, 10) || 0) / 100;
  }

  public ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopMusic();
    }
  }

}
