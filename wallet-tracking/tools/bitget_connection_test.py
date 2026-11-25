#!/usr/bin/env python3
"""Local read-only Bitget pilot. Never stores credentials or account data."""
import base64, hashlib, hmac, json, time, getpass, re, warnings
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler
from urllib.error import HTTPError, URLError

PATHS = ('/api/v3/account/info', '/api/v3/account/assets', '/api/v2/spot/account/assets?assetType=hold_only')
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def signature(secret, timestamp, path):
    return base64.b64encode(hmac.new(secret.encode(), (timestamp+'GET'+path).encode(), hashlib.sha256).digest()).decode()

def request(path, key, secret, phrase):
    if path not in PATHS:
        raise ValueError('Endpoint not allowed')
    ts = str(time.time_ns()//1000000)
    req = Request('https://api.bitget.com'+path, method='GET', headers={'ACCESS-KEY':key,'ACCESS-SIGN':signature(secret,ts,path),'ACCESS-TIMESTAMP':ts,'ACCESS-PASSPHRASE':phrase,'locale':'en-US','Content-Type':'application/json'})
    try:
        with build_opener(ProxyHandler({}), NoRedirect()).open(req, timeout=15) as r:
            status, raw = r.status, r.read(2000000)
    except HTTPError as e:
        status, raw = e.code, e.read(2000000)
    except (URLError, TimeoutError, OSError):
        return 'network_error', None
    try:
        obj=json.loads(raw)
        code=str(obj.get('code',''))
        if not re.fullmatch(r'[0-9]{5}',code): code='invalid_response'
        if status != 200 or code != '00000': return f'HTTP {status}, Bitget {code}',None
        return '00000',obj.get('data')
    except (ValueError, AttributeError):
        return f'HTTP {status}, invalid_response',None

def pilot(call):
    code, info=call(PATHS[0])
    print('API-Info:',code)
    if code != '00000' or not isinstance(info,dict):
        print('Leseberechtigung nicht automatisch verifizierbar; Test gestoppt.'); return False
    perm=re.sub(r'[^a-z]','',str(info.get('permType','')).lower())
    perms=info.get('permissions')
    if perm != 'readonly' or not isinstance(perms,list) or any('withdraw' in str(p).lower() or 'transfer' in str(p).lower() for p in perms):
        print('Leseberechtigung nicht eindeutig oder Transfer-/Auszahlungsrecht vorhanden; Test gestoppt.'); return False
    print('Read-only: bestätigt')
    success=False
    for label,path in [('UTA',PATHS[1]),('Classic Spot',PATHS[2])]:
        code,data=call(path)
        valid=code=='00000' and (isinstance(data,dict) if label=='UTA' else isinstance(data,list))
        print(label+':',code if valid or code!='00000' else 'invalid_response')
        if valid:
            success=True
            if label=='UTA':
                print('  Asset-Anzahl:',len(data['assets']) if isinstance(data.get('assets'),list) else 'unbekannt')
            else: print('  Asset-Anzahl:',len(data))
    print('Verbindung:', 'PASS' if success else 'FAIL')
    return success

def main():
    warnings.simplefilter('error',getpass.GetPassWarning)
    try:
        print('WalletTracking 10.09 – lokaler Bitget-Verbindungstest')
        key=getpass.getpass('API Key: '); secret=getpass.getpass('API Secret: '); phrase=getpass.getpass('API Passphrase: ')
        if not all((key,secret,phrase)) or any('\n' in s or '\r' in s for s in (key,secret,phrase)): return 1
        return 0 if pilot(lambda path:request(path,key,secret,phrase)) else 1
    except (KeyboardInterrupt, EOFError, getpass.GetPassWarning, ValueError):
        print('\nAbgebrochen. Keine Zugangsdaten gespeichert.'); return 1
if __name__=='__main__': raise SystemExit(main())
