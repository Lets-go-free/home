/**
 * TLN Protocol - Blockchain Price Fetcher
 * Version: 2026-01-03 19:38:59 CET
 * 
 * Holt aktuelle VOW und v$ Preise von PancakeSwap V2 auf Binance Smart Chain
 */

// RPC Endpoint
const TLN_RPC = "https://bsc-dataseed.binance.org/";

// Token Contract Adressen
const TLN_CONTRACTS = {
    VOW: "0xf585b5b4f22816baf7629aea55b701662630397b",
    V_DOLLAR: "0x9C23942Ca2C35e06d1d20747F33705983A18d2AB"
};

// PancakeSwap V2 Pool Adressen
const TLN_POOLS = {
    VOW_USDT: "0xc6585bc17b53792f281a9739579dd60535c1f9fb",
    VOW_VDOLLAR: "0xc51c99af9d5c31d0c37d028500b2b344debdf188"
};

// PancakeSwap Pair ABI (minimal)
const PAIR_ABI = [
    "function getReserves() view returns (uint112,uint112,uint32)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
];

/**
 * Holt den Preis eines Tokens aus einem PancakeSwap Pool
 * @param {ethers.Provider} provider - Ethers.js Provider
 * @param {string} poolAddress - Pool Contract Adresse
 * @param {string} baseToken - Token Adresse für den Preis berechnet werden soll
 * @returns {Promise<number>} - Preis des Tokens
 */
async function getPriceFromPool(provider, poolAddress, baseToken) {
    const pair = new ethers.Contract(poolAddress, PAIR_ABI, provider);

    const [token0, token1, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves()
    ]);

    const r0 = Number(ethers.formatUnits(reserves[0], 18));
    const r1 = Number(ethers.formatUnits(reserves[1], 18));

    if (token0.toLowerCase() === baseToken.toLowerCase()) return r1 / r0;
    if (token1.toLowerCase() === baseToken.toLowerCase()) return r0 / r1;

    throw new Error("Token nicht im Pool gefunden");
}

/**
 * Holt aktuelle VOW und v$ Preise von PancakeSwap
 * @returns {Promise<Object>} - Objekt mit vowPrice und vDollarPrice
 * @example
 * const prices = await fetchTLNPrices();
 * console.log(prices.vowPrice); // z.B. 0.052341
 * console.log(prices.vDollarPrice); // z.B. 0.891234
 */
async function fetchTLNPrices() {
    try {
        // Erstelle Provider
        const provider = new ethers.JsonRpcProvider(TLN_RPC);

        // VOW -> USD (direkt aus VOW/USDT Pool)
        const vowUsd = await getPriceFromPool(
            provider, 
            TLN_POOLS.VOW_USDT, 
            TLN_CONTRACTS.VOW
        );

        // v$ -> VOW (aus VOW/v$ Pool)
        const vDollarInVow = await getPriceFromPool(
            provider, 
            TLN_POOLS.VOW_VDOLLAR, 
            TLN_CONTRACTS.V_DOLLAR
        );

        // v$ -> USD (v$ in VOW * VOW in USD)
        const vDollarUsd = vDollarInVow * vowUsd;

        return {
            vowPrice: vowUsd,
            vDollarPrice: vDollarUsd,
            success: true
        };

    } catch (error) {
        console.error('Fehler beim Laden der TLN Preise:', error);
        return {
            vowPrice: null,
            vDollarPrice: null,
            success: false,
            error: error.message
        };
    }
}

/**
 * Formatiert Preis als Dollar-String mit 6 Dezimalstellen
 * @param {number} price - Preis
 * @returns {string} - Formatierter String (z.B. "$0.052341")
 */
function formatTLNPrice(price) {
    if (price === null || price === undefined) return 'Fehler';
    return '$' + price.toFixed(6);
}
