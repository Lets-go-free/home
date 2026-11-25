#!/usr/bin/env python3
"""Local read-only Bitget pilot. Never stores credentials or account data."""
import base64, hashlib, hmac, json, time, getpass, re, warnings
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

UTA_INFO = '/api/v3/account/info'
UTA_ASSETS = '/api/v3/account/assets'
CLASSIC_INFO = '/api/v2/spot/account/info'
CLASSIC_PROBES = [('Classic Spot', '/api/v2/spot/account/assets?assetType=hold_only')]
CLASSIC_PROBES += [('Classic '+kind, '/api/v2/mix/account/accounts?productType='+kind) for kind in ('USDT-FUTURES','USDC-FUTURES','COIN-FUTURES')]
CLASSIC_PROBES += [('Classic Margin Cross', '/api/v2/margin/crossed/account/assets'), ('Classic Margin Isolated', '/api/v2/margin/isolated/account/assets')]
PATHS = (UTA_INFO, UTA_ASSETS, CLASSIC_INFO) + tuple(path for _,path in CLASSIC_PROBES)
CLASSIC_READ = {'coor','cpor','stor','smor','ttor'}
UTA_READ = {'uta_mgt','uta_trade','copy_futures_position','copy_futures_order'}
# Exact generated GET paths only; no user-supplied URLs or write methods.
KINDS = ('USDT-FUTURES','USDC-FUTURES','COIN-FUTURES')
BALANCE_FIELDS = ('coin','symbol','marginCoin','available','frozen','locked','accountEquity','usdtEquity','btcEquity','usdValue','net','netAssets','netAssetsInUsdt','total','borrow','borrowed','interest','liability','loan','unrealizedPL','unrealizedPLByCoin','baseCoin','quoteCoin','baseCoinTotal','quoteCoinTotal','baseCoinBorrowed','quoteCoinBorrowed','baseCoinInterest','quoteCoinInterest','baseCoinNet','quoteCoinNet','baseCoinAvailable','quoteCoinAvailable')
POSITION_FIELDS = ('symbol','marginCoin','holdSide','total','openPriceAvg','leverage','marginSize','marginMode','liquidationPrice','markPrice','unrealizedPL','achievedProfits','takeProfit','stopLoss','totalFee','deductedFee')
ORDER_FIELDS = ('symbol','planType','side','posSide','tradeSide','size','triggerPrice','triggerType','executePrice','stopSurplusTriggerPrice','stopLossTriggerPrice','planStatus','cTime','uTime')
FILL_FIELDS = ('symbol','side','tradeSide','price','priceAvg','amount','baseVolume','quoteVolume','size','profit','fee','feeCoin','cTime','uTime','enterPointSource')
BILL_FIELDS = ('symbol','coin','amount','fee','businessType','cTime','interestCoin','loanCoin','interestAmount','dailyInterestRate')
def path_for(base, **params):
    return base + ('?' + urlencode(params) if params else '')

def detail_probes(now, symbols=()):
    window = dict(startTime=now-7*86400000+1000,endTime=now,limit=100)
    specs=[]
    def add(label,base,key,fields,**params):
        specs.append((label,path_for(base,**params),key,fields))
    for kind in KINDS:
        add(kind+' Positionen','/api/v2/mix/position/all-position',None,POSITION_FIELDS,productType=kind)
        add(kind+' SL/TP aktiv','/api/v2/mix/order/orders-plan-pending','entrustedList',ORDER_FIELDS,productType=kind,planType='profit_loss',limit=100)
        add(kind+' SL/TP Historie','/api/v2/mix/order/orders-plan-history','entrustedList',ORDER_FIELDS,productType=kind,planType='profit_loss',**window)
        add(kind+' Trades','/api/v2/mix/order/fill-history','fillList',FILL_FIELDS,productType=kind,**window)
        add(kind+' Funding','/api/v2/mix/account/bill','bills',BILL_FIELDS,productType=kind,businessType='contract_settle_fee',**window)
    add('Spot Trades','/api/v2/spot/trade/fills',None,FILL_FIELDS,**window)
    add('Cross Kreditzinsen','/api/v2/margin/crossed/interest-history','resultList',BILL_FIELDS,**window)
    for symbol in symbols:
        if not re.fullmatch(r'[A-Z0-9]{2,30}',symbol): continue
        for mode in ('crossed','isolated'):
            add(mode+' '+symbol+' Trades','/api/v2/margin/'+mode+'/fills','fills',FILL_FIELDS,symbol=symbol,**window)
        add('Isolated '+symbol+' Kreditzinsen','/api/v2/margin/isolated/interest-history','resultList',BILL_FIELDS,symbol=symbol,**window)
    return specs

def rows_for(data,key):
    rows=data.get(key) if key and isinstance(data,dict) else data if key is None else None
    return rows if isinstance(rows,list) and all(isinstance(r,dict) for r in rows) else None

def show_rows(rows,fields):
    for row in rows[:5]:
        # JSON escapes control characters; do not display identifiers or arbitrary nested objects.
        safe={k:row[k] for k in fields if k in row and isinstance(row[k],(str,int,float,type(None)))}
        if isinstance(row.get('feeDetail'),(list,dict)) and fields == FILL_FIELDS:
            fees=row['feeDetail'] if isinstance(row['feeDetail'],list) else [row['feeDetail']]
            safe['feeDetail']=[{k:f[k] for k in ('feeCoin','totalFee','totalDeductionFee') if k in f and isinstance(f[k],(str,int,float))} for f in fees if isinstance(f,dict)]
        print('  '+json.dumps(safe,ensure_ascii=True))
    if len(rows)>5: print('  Weitere Datensaetze nicht angezeigt.')

def details(call, balances, now, show=False):
    symbols=sorted({str(r.get('symbol','')).upper() for label,rows in balances if 'Margin Isolated' in label for r in rows if re.fullmatch(r'[A-Za-z0-9]{2,30}',str(r.get('symbol','')))})[:5]
    print('Historie: erste Seite je Abfrage, letzte 7 Tage; keine Vollstaendigkeitsaussage.')
    print('Margin-Paare aus Isolated-Bestand (max. 5):',len(symbols),'— andere Paare nicht geprueft.')
    ok=0; specs=detail_probes(now,symbols)
    for label,path,key,fields in specs:
        code,data=call(path)
        rows=rows_for(data,key) if code=='00000' else None
        if rows is None:
            print(label+':',code if code!='00000' else 'invalid_response'); continue
        ok+=1
        print(label+': PASS, Datensaetze:',len(rows))
        if len(rows)>=100 or (isinstance(data,dict) and any(data.get(k) for k in ('endId','minId','idLessThan'))): print('  Pagination moeglich; nicht vollstaendig geprueft.')
        if show: show_rows(rows,fields)
    print('Datenprobe:', 'PASS' if ok==len(specs) else 'PARTIAL' if ok else 'FAIL',f'({ok}/{len(specs)})')
    return ok==len(specs)

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def signature(secret, timestamp, path):
    return base64.b64encode(hmac.new(secret.encode(), (timestamp+'GET'+path).encode(), hashlib.sha256).digest()).decode()

def request(path, key, secret, phrase, extra_paths=()):
    if path not in PATHS and path not in extra_paths:
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

def pilot(call, extended=False, show=False, now=None):
    balances=[]
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
            balances.append((label,rows))
            if show: show_rows(rows,BALANCE_FIELDS)
    print('Verbindung:', 'PASS' if successes == len(probes) else 'PARTIAL' if successes else 'FAIL', f'({successes}/{len(probes)})')
    connected = successes == len(probes)
    if extended and connected and probes is CLASSIC_PROBES:
        return details(call,balances,now,show)
    if extended and connected: print("Erweiterte Datenprobe fuer UTA noch offen.")
    return connected

def main():
    warnings.simplefilter('error',getpass.GetPassWarning)
    try:
        print('WalletTracking 10.11 – lokaler Bitget-Verbindungstest')
        key=getpass.getpass('API Key: '); secret=getpass.getpass('API Secret: '); phrase=getpass.getpass('API Passphrase: ')
        if not all((key,secret,phrase)) or any('\n' in s or '\r' in s for s in (key,secret,phrase)): return 1
        show=input('Finanzdaten lokal anzeigen? [j/N]: ').strip().lower()=='j'
        now=time.time_ns()//1000000
        extras=set(path for _,path,_,_ in detail_probes(now))
        def call(path):
            code,data=request(path,key,secret,phrase,extras)
            if path == CLASSIC_PROBES[-1][1] and code=='00000' and isinstance(data,list):
                symbols=sorted({str(r.get('symbol','')).upper() for r in data if isinstance(r,dict) and re.fullmatch(r'[A-Za-z0-9]{2,30}',str(r.get('symbol','')))})[:5]
                extras.update(p for _,p,_,_ in detail_probes(now,symbols))
            time.sleep(.15)
            return code,data
        return 0 if pilot(call,extended=True,show=show,now=now) else 1
    except (KeyboardInterrupt, EOFError, getpass.GetPassWarning, ValueError):
        print('\nAbgebrochen. Keine Zugangsdaten gespeichert.'); return 1
if __name__=='__main__': raise SystemExit(main())
