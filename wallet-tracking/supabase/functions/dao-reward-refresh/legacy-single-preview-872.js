// 8.72: Pure, read-only decision helper. No inferred NFT or monetary value.
export const LEGACY_SINGLE_TEST_WALLET_872='8a3c5dc6-0610-482d-a327-3f3ba03db158'
export const LEGACY_SINGLE_NFT_CONTRACT_872='0xa1b761890c36e356f49f9df8d495fcffa76857ad'
export const LEGACY_PRICE_START_872=88356
const lower=s=>String(s||'').toLowerCase()
export function assessLegacySingle872({candidate,transaction,proof,ownership,catalog,canonicalCount,flowCount}){
 const blockers=[]
 const raw=lower(transaction?.raw_input)
 const match=/^0x86bb8f37([0-9a-f]{64})([0-9a-f]{64})$/.exec(raw)
 const vault=match?BigInt('0x'+match[1]):null
 const parameter=match?BigInt('0x'+match[2]):null
 const nftId=vault===818n?818:vault===819n?819:null
 if(!candidate||candidate.status!=='unassigned_legacy'||candidate.payout_status!=='pending')blockers.push('candidate-not-unassigned-pending')
 if(!transaction||lower(transaction.selector)!=='0x86bb8f37'||
    !['ok','success'].includes(lower(transaction.status))||
    Number(transaction.block_number)!==Number(candidate?.claim_block)||
    Number(transaction.value_aptm)!==0)blockers.push('claim-transaction-guard')
 if(nftId===null||parameter!==50n)blockers.push('unexpected-legacy-calldata')
 if(proof?.status!=='verified'||proof.reason!=='matched-native-minter-call-and-event'||
    !/^[1-9][0-9]*$/.test(String(proof.amountRaw||''))||proof.asset!=='native'||proof.decimals!==18)
    blockers.push('native-mint-proof-not-verified')
 if(canonicalCount!==0)blockers.push('canonical-claim-exists')
 if(flowCount!==0)blockers.push('persisted-flow-exists')
 if(nftId!==null&&(!ownership||Number(ownership.nft_id)!==nftId||ownership.is_current!==false||
    ownership.acquisition_verified!==true||ownership.acquisition_kind!=='mint_to_own_wallet'||
    Number(ownership.owned_from_block)!==10904||
    Number(ownership.owned_to_block)!==(nftId===818?11448349:11448526)||
    !(Number(candidate?.claim_block)>Number(ownership.owned_from_block)&&
      Number(candidate?.claim_block)<Number(ownership.owned_to_block))))blockers.push('historical-ownership-not-proven')
 if(nftId!==null&&(!catalog||Number(catalog.nft_id)!==nftId||catalog.subtype!=='Mining-Bot'))blockers.push('nft-catalog-mismatch')
 const block=Number(candidate?.claim_block)
 const price=Number.isSafeInteger(block)&&block<LEGACY_PRICE_START_872
  ?{status:'unpriced_before_exact_anchor',valueUsd:null,reason:'before-first-proven-pool-block'}
  :{status:'exact_v13_proof_required',valueUsd:null,reason:'no-price-written-or-inferred'}
 return {status:blockers.length?'needs_review':'verified_preview',blockers,nftId,
  amountRaw:proof?.status==='verified'?proof.amountRaw:null,
  amountAptm:proof?.status==='verified'?proof.amountAptm:null,
  price,proposedChanges:blockers.length?[]:[
   'native payout evidence','historical NFT association','canonical claim via existing guarded pipeline',
   'exact-v13 USD only after independent historical proof'
  ],writesPerformed:0}
}
