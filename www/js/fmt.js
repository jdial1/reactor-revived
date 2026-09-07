// Big-number formatting. Costs reach ~1e33, which doubles carry fine - no
// big-number library.
const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function fmt(n) {
	if (!isFinite(n)) return "∞";
	if (n < 0) return "-" + fmt(-n);
	if (n < 1000) return String(Math.floor(n));

	const tier = Math.floor(Math.log10(n) / 3);
	if (tier >= SUFFIX.length) return n.toExponential(2).replace("e+", "e");

	const scaled = n / 10 ** (tier * 3);
	// 4 significant digits, truncated not rounded - rounding 999999 up to
	// "1000K" instead of "999.9K" is exactly the glitch this avoids.
	const places = 10 ** Math.max(0, 3 - Math.floor(Math.log10(scaled)));
	return String(Math.floor(scaled * places) / places) + SUFFIX[tier];
}
