import { test } from "node:test";
import assert from "node:assert/strict";
import { tidyEntries } from "../www/js/records.js";

const book = (...texts) => texts.map((text, tick) => ({ tick, text }));

test("the log book folds each run of one kind into one line, newest first", () => {
	assert.deepEqual(tidyEntries(book(
		"Supplied: Uranium Cell.",
		"Supplied: Heat Vent.",
		"Supplied: Capacitor, Plating.",
		"Field note filed: Neutron reflectors.",
		"Field note filed: Protium.",
		"Entered in the record: The Long Night.",
	)), [
		"Entered in the record: The Long Night.",
		"Field notes filed: Protium, Neutron reflectors.",
		"Supplied: Capacitor, Plating, Heat Vent, Uranium Cell.",
	]);
});

test("a run is only a run while nothing else comes between", () => {
	assert.deepEqual(tidyEntries(book(
		"Supplied: Heat Vent.",
		"Order revised. 500 cancelled. Output required: 750 per tick.",
		"Supplied: Capacitor.",
	)), [
		"Supplied: Capacitor.",
		"Order revised. 500 cancelled. Output required: 750 per tick.",
		"Supplied: Heat Vent.",
	]);
});

test("letters are left to the Letters list, and a run folds across them", () => {
	assert.deepEqual(tidyEntries(book(
		"Supplied: Heat Vent.",
		"Letter found: Regional Energy Authority.",
		"Letter received: Harrow Supply.",
		"Supplied: Capacitor.",
	)), ["Supplied: Capacitor, Heat Vent."]);
	assert.deepEqual(tidyEntries([]), []);
});
