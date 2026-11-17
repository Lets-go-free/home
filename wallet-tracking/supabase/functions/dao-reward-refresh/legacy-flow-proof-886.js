// Pure read-only amount guard: exact native mint raw units vs historical
// browser-canonical numeric amounts (some were rounded via JS Number).
// The allowance is strictly 1e-12 APTM = 1,000,000 wei; NEVER use it to
// construct a payout flow, update a reward, or infer a USD price.
export function assessHistoricalRawAmount886(raw, amount) {
  if (!/^[1-9][0-9]*$/.test(String(raw ?? '')) ||
      !/^[0-9]+(?:\.[0-9]{1,18})?$/.test(String(amount ?? '')))
    return {ok:false, reason:'invalid-raw-or-canonical-decimal'}
  const [whole, fraction=''] = String(amount).split('.')
  const canonicalRaw = BigInt(whole)*10n**18n + BigInt((fraction+'0'.repeat(18)).slice(0,18))
  const difference = BigInt(raw)-canonicalRaw
  const absolute = difference<0n?-difference:difference
  return {ok:absolute<=1000000n, reason:absolute<=1000000n?'within-historical-precision':'amount-discrepancy',
    differenceWei:difference.toString(), precisionLimitWei:'1000000'}
}
