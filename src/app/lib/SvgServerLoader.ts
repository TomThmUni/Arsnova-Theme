import { makeStateKey, StateKey, TransferState } from '@angular/platform-browser';
import { SvgLoader } from 'angular-svg-icon';
import { Observable } from 'rxjs';

const fs = require('fs');
const join = require('path').join;
const parseUrl = require('url').parse;
const baseName = require('path').basename;

export class SvgServerLoader implements SvgLoader {

  constructor(private iconPath: string, private transferState: TransferState) {
  }

  public getSvg(url: string): Observable<string> {
    const parsedUrl: URL = parseUrl(url);
    const fileNameWithHash = baseName(parsedUrl.pathname);
    // Remove content hashing
    const fileName = fileNameWithHash.replace(/^(.*)(\.[0-9a-f]{16,})(\.svg)$/i, '$1$3');
    const filePath = join(this.iconPath, fileName);
    return Observable.create(observer => {
      const svgData = fs.readFileSync(filePath, 'utf8');

      // Here we save the translations in the transfer-state
      const key: StateKey<number> = makeStateKey<number>('transfer-svg:' + url);
      this.transferState.set(key, svgData);

      observer.next(svgData);
      observer.complete();
    });
  }
}
