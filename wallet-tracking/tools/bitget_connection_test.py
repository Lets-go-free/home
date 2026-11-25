#!/usr/bin/env python3
"""Local read-only Bitget pilot. Never stores credentials or account data."""
import base64, hashlib, hmac, json, time, getpass, re, warnings
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler
from urllib.error import HTTPError, URLError

UTA_INFO = '/api/v3/account/info'
UTA_ASSETS = '/api/v3/account/assets'
CLASSIC_INFO = '/api/v2/spot/account/info'
CLASSIC_PROBES = [('Classic Spot', '/api/v2/spot/account/assets?assetType=hold_only')]
CLASSIC_PROBES += [('Classic '+kind, '/api/v2/mix/account/accounts?productType='+kind) for kind in ('USDT-FUTURES','USDC-FUTURES','COIN-FUTURES')]
CLASSIC_PROBES += [('Classic Margin Cross', '/api/v2/margin/crossed/account/assets'), ('Classic Margin Isolated', '/api/v2/margin/isolated/account/assets')]
PATHS = (UTA_INFO, UTA_ASSETS, CLASSIC_INFO) + tuple(path for _,path in CLASSIC_PROBES)
CLASSIC_READ = {'coor','cpor','stor','smor','ttor'}
UTA_READ = {'uta_mgt','uta_trade','copy_futures_position','copy_futures_order'}
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

def allowed(values, whitelist):
    return isinstance(values,list) and bool(values) and all(isinstance(v,str) and v in whitelist for v in values)

def pilot(call):
    code, info = call(UTA_INFO)
    print('UTA API-Info:', code)
    if code == 'HTTP 400, Bitget 40084':
        print('Classic-Fallback (Kontotyp noch zu bestätigen)')
        code, info = call(CLASSIC_INFO)
        print('Classic API-Info:', code)
        if code != '00000' or not isinstance(info,dict) or not allowed(info.get('authorities'), CLASSIC_READ):
            print('Classic Read-only nicht eindeutig oder unerlaubte Berechtigung; Test gestoppt.')
            return False
        print('Kontotyp: Classic (V2 erreichbar)')
        print('Read-only: bestätigt')
        probes = CLASSIC_PROBES
    elif code == '00000' and isinstance(info,dict):
        perm = re.sub(r'[^a-z]','',str(info.get('permType','')).lower())
        if perm != 'readonly' or not allowed(info.get('permissions'), UTA_READ):
            print('UTA Read-only nicht eindeutig oder unerlaubte Berechtigung; Test gestoppt.')
            return False
        print('Kontotyp: UTA')
        print('Read-only: bestätigt')
        probes = [('UTA', UTA_ASSETS)]
    else:
        print('Leseberechtigung nicht automatisch verifizierbar; Test gestoppt.')
        return False
    successes = 0
    for label,path in probes:
        code,data = call(path)
        rows = data.get('assets') if label == 'UTA' and isinstance(data,dict) else data if label != 'UTA' else None
        valid = code == '00000' and isinstance(rows,list) and all(isinstance(row,dict) for row in rows)
        print(label+':', code if valid or code != '00000' else 'invalid_response')
        if valid:
            successes += 1
            print('  Datensätze:',len(rows))
    print('Verbindung:', 'PASS' if successes == len(probes) else 'PARTIAL' if successes else 'FAIL', f'({successes}/{len(probes)})')
    return successes == len(probes)

def main():
    warnings.simplefilter('error',getpass.GetPassWarning)
    try:
        print('WalletTracking 10.10 – lokaler Bitget-Verbindungstest')
        key=getpass.getpass('API Key: '); secret=getpass.getpass('API Secret: '); phrase=getpass.getpass('API Passphrase: ')
        if not all((key,secret,phrase)) or any('\n' in s or '\r' in s for s in (key,secret,phrase)): return 1
        return 0 if pilot(lambda path:request(path,key,secret,phrase)) else 1
    except (KeyboardInterrupt, EOFError, getpass.GetPassWarning, ValueError):
        print('\nAbgebrochen. Keine Zugangsdaten gespeichert.'); return 1
if __name__=='__main__': raise SystemExit(main())
