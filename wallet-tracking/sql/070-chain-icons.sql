-- WalletTracking Phase 5.82
-- Datengetriebene Chain-Logos. Lokale Asset-Pfade sind bewusst in public.chains
-- gespeichert, damit neue Chains ohne neue UI-Hardcodierung ein Logo erhalten können.

alter table public.chains
  add column if not exists icon_path text;

-- Chain-spezifische Logos haben Vorrang vor dem Native-Asset-Fallback.
update public.chains set icon_path = './assets/crypto/base.svg'
where lower(coalesce(chain_key,'')) = 'base';

update public.chains set icon_path = './assets/crypto/arbitrum.svg'
where lower(coalesce(chain_key,'')) in ('arbitrum','arb','arbitrum-one');

update public.chains set icon_path = './assets/crypto/polygon.svg'
where lower(coalesce(chain_key,'')) in ('polygon','matic');

-- Vorhandene Standard-Chains anhand Native-Symbol befüllen.
update public.chains set icon_path = './assets/crypto/aptm.svg'
where upper(coalesce(native_symbol,'')) = 'APTM' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/bnb.svg'
where upper(coalesce(native_symbol,'')) = 'BNB' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/eth.svg'
where upper(coalesce(native_symbol,'')) = 'ETH' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/avax.svg'
where upper(coalesce(native_symbol,'')) = 'AVAX' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/btc.svg'
where upper(coalesce(native_symbol,'')) = 'BTC' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/sol.svg'
where upper(coalesce(native_symbol,'')) = 'SOL' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/xrp.svg'
where upper(coalesce(native_symbol,'')) = 'XRP' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/trx.svg'
where upper(coalesce(native_symbol,'')) = 'TRX' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/akt.svg'
where upper(coalesce(native_symbol,'')) = 'AKT' and coalesce(icon_path,'') = '';

update public.chains set icon_path = './assets/crypto/polygon.svg'
where upper(coalesce(native_symbol,'')) in ('POL','MATIC') and coalesce(icon_path,'') = '';
