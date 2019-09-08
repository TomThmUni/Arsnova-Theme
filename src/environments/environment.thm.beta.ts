import { LoginMechanism } from '../lib/enums/enums';
import { IEnvironment } from '../lib/interfaces/IEnvironment';

export const environment: IEnvironment = {
  production: true,
  ssrEndpoint: 'https://beta.arsnova.click/backend',
  serverEndpoint: 'https://beta.arsnova.click/backend',
  httpApiEndpoint: 'https://beta.arsnova.click/backend/api/v1',
  httpLibEndpoint: 'https://beta.arsnova.click/backend/lib',
  stompConfig: {
    endpoint: 'wss://beta.arsnova.click/rabbitmq/ws',
    user: 'beta',
    password: 'beta',
    vhost: 'beta',
  },
  leaderboardAmount: 5,
  readingConfirmationEnabled: false,
  confidenceSliderEnabled: false,
  infoAboutTabEnabled: false,
  infoProjectTabEnabled: false,
  infoBackendApiEnabled: false,
  requireLoginToCreateQuiz: true,
  forceQuizTheme: true,
  loginMechanism: [LoginMechanism.UsernamePassword, LoginMechanism.Token],
  showJoinableQuizzes: false,
  showPublicQuizzes: false,
  persistQuizzes: false,
};

export enum DEVICE_TYPES {
  XS, SM, MD, LG, XLG
}

export enum LIVE_PREVIEW_ENVIRONMENT {
  ANSWEROPTIONS, QUESTION
}