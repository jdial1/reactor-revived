// Big-number formatting. Costs reach ~1e33, which doubles carry fine - no
// big-number library.
const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/**
 * A number in at most four characters and a suffix, for places with no room:
 * 29K, 2.7M, 166K, 960. Truncated, never rounded up, so it never reads
 * higher than the truth.
 */
export function compact(n) {
	if (!isFinite(n)) return "∞";
	if (n < 0) return "-" + compact(-n);
	if (n < 10) return String(Math.floor(n * 10) / 10);
	if (n < 1000) return String(Math.floor(n));
	const tier = Math.floor(Math.log10(n) / 3);
	if (tier >= SUFFIX.length) return n.toExponential(0).replace("e+", "e");
	const scaled = n / 10 ** (tier * 3);
	return (scaled < 10 ? String(Math.floor(scaled * 10) / 10) : String(Math.floor(scaled))) + SUFFIX[tier];
}

export function fmt(n) {
	if (!isFinite(n)) return "∞";
	if (n < 0) return "-" + fmt(-n);
	if (n < 1000) return String(Math.floor(n));

	const tier = Math.floor(Math.log10(n) / 3);
	if (tier >= SUFFIX.length) return n.toExponential(2).replace("e+", "e");

	// Three decimals of the scaled value, truncated - matching the original
	// exactly, and avoiding the glitch where rounding turns 999999 into
	// "1000K" instead of "999.999K".
	const scaled = n / 10 ** (tier * 3);
	return String(Math.floor(scaled * 1000) / 1000) + SUFFIX[tier];
}
