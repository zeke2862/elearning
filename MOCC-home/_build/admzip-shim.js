// 瀏覽器版 adm-zip 替身：只提供評分程式用到的 getEntry / readAsText / getData
const { unzipSync } = require('fflate');
class AdmZip {
  constructor(buf) { this._f = unzipSync(buf instanceof Uint8Array ? buf : new Uint8Array(buf)); }
  getEntry(name) {
    const d = this._f[name];
    return d ? { entryName: name, getData: () => d } : null;
  }
  readAsText(entry) { return entry ? new TextDecoder('utf-8').decode(entry.getData()) : ''; }
}
module.exports = AdmZip;
