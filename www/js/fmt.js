// Big-number formatting. Costs reach ~1e33, which doubles carry fine - no
// big-number library.
const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

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
