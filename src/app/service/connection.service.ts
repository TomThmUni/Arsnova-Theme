import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {DefaultSettings} from '../../lib/default.settings';
import {HttpClient} from '@angular/common/http';
import {WebsocketService} from './websocket.service';
import {of, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {IMessage} from 'arsnova-click-v2-types/src/common';
import {SharedService} from './shared.service';

@Injectable()
export class ConnectionService {
  get lowSpeed(): boolean {
    return this._lowSpeed;
  }
  get mediumSpeed(): boolean {
    return this._mediumSpeed;
  }
  set websocketAvailable(value: Boolean) {
    this._websocketAvailable = value;
  }

  get socket(): Subject<IMessage> | any {
    if (!this._socket) {
      return {subscribe: () => {}};
    }
    return this._socket;
  }

  set serverAvailable(value: Boolean) {
    this._serverAvailable = value;
  }

  get serverAvailable(): Boolean {
    return this._serverAvailable;
  }

  get websocketAvailable(): Boolean {
    return this._websocketAvailable;
  }

  get rtt(): number {
    return this._rtt;
  }

  private _socket: Subject<IMessage>;
  private _serverAvailable: Boolean;
  private _websocketAvailable: Boolean = false;
  private _rtt = 0;
  private _isWebSocketAuthorized = false;
  private _lowSpeed = false;
  private _mediumSpeed = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private websocketService: WebsocketService,
    private http: HttpClient,
    private sharedService: SharedService
  ) {
    this.initWebsocket();
  }

  private initWebsocket() {
    const defaultSocket = <Subject<MessageEvent>>this.websocketService.connect();

    if (defaultSocket) {
      this._socket = <Subject<IMessage>>defaultSocket.pipe(map((response: MessageEvent): IMessage => {
        const parsedResponse = JSON.parse(response.data);
        this._websocketAvailable = true;

        if (parsedResponse.payload && parsedResponse.payload.activeQuizzes) {
          this.sharedService.activeQuizzes = [...parsedResponse.payload.activeQuizzes];
        }

        return parsedResponse;
      }));
    }
  }

  cleanUp(): void {
    this._isWebSocketAuthorized = false;
  }

  public sendMessage(message: IMessage): void {
    if (!this._websocketAvailable) {
      setTimeout(() => {
        this.sendMessage(message);
      }, 500);
      return;
    }
    this._socket.next(message);
  }

  private sendAuthorizationMessage(hashtag: string, step: string, auth: string): void {
    if (!this._socket) {
      return;
    }

    if (!this._websocketAvailable) {
      setTimeout(() => {
        this.sendAuthorizationMessage(hashtag, step, auth);
      }, 500);
      return;
    }
    this._socket.next({
      step: step, payload: {
        quizName: hashtag,
        webSocketAuthorization: auth
      }
    });
  }

  authorizeWebSocket(hashtag: string): void {
    if (this._isWebSocketAuthorized) {
      return;
    }
    this._isWebSocketAuthorized = true;
    this.sendAuthorizationMessage(hashtag, 'WEBSOCKET:AUTHORIZE', window.sessionStorage.getItem('config.websocket_authorization'));
  }

  authorizeWebSocketAsOwner(hashtag: string): void {
    if (this._isWebSocketAuthorized) {
      return;
    }
    this._isWebSocketAuthorized = true;
    this.sendAuthorizationMessage(hashtag, 'WEBSOCKET:AUTHORIZE_AS_OWNER', window.localStorage.getItem('config.private_key'));
  }

  initConnection(overrideCurrentState?: boolean): Promise<any> {
    return new Promise(async (resolve) => {
      if (this.serverAvailable && !overrideCurrentState) {
        resolve();
        return;
      }
      const data = await new Promise(resolve2 => {
        this.http.get(`${DefaultSettings.httpApiEndpoint}`).subscribe(
          (httpData) => {
            this.serverAvailable = true;
            this._websocketAvailable = true;
            setTimeout(this.calculateRTT.bind(this), 500);
            resolve2(httpData);
          },
          () => {
            this.serverAvailable = false;
            this._websocketAvailable = false;
            resolve2();
          }
        );
      });
      resolve(data);
    });
  }

  calculateConnectionSpeedIndicator() {
    if (this._rtt > 800) {
      this._lowSpeed = true;
      this._mediumSpeed = false;
    } else if (this._rtt > 300) {
      this._lowSpeed = false;
      this._mediumSpeed = true;
    } else {
      this._lowSpeed = false;
      this._mediumSpeed = false;
    }
  }

  calculateRTT() {
    const start_time = new Date().getTime();
    this.http.get(`${DefaultSettings.httpApiEndpoint}`).subscribe(
      () => {
        this.serverAvailable = true;
        this._rtt = new Date().getTime() - start_time;
        this.calculateConnectionSpeedIndicator();
      },
      () => {
        this.serverAvailable = false;
        this._websocketAvailable = false;
        this._socket = null;
      }
    );
  }
}
