var me = module.exports;

const FuzzySet = require('fuzzyset')
//ttps://github.com/Glench/fuzzyset.js

//testing: cases

// let r_contains = me.processFuzzy("Prince and the Revolution","Prince")
//
// let r_interval_true = me.processFuzzy("Priince","Prince")
//
// let r_interval_false = me.processFuzzy("Priingle2reiince","Prince")


/**
 * processFuzzy - input a match_string and see if it matches/is contained in match_against_string
 * @param match_against_string
 * @param match_string
 * @returns {{result: boolean, match_summary: {match_against_string: *, match_string: *, match_result: *}, result_reason: string}|{result: boolean, result_reason: string}}
 */
me.processFuzzy = function (match_string,match_against_string) {


	let match_summary ={
		match_string:match_string,
		match_against_string:match_against_string,
		match_result:null
	}

	// sanity check = if the strings contain each other
	var contains = match_against_string.indexOf(match_string) !== -1 || match_string.indexOf(match_against_string) !== -1;

	if (contains) {
		match_summary.match_result  = match_string;
		return {result: true, result_reason: "contains",match_summary:match_summary}
	} else {

		var a = FuzzySet();
		a.add(match_against_string);

		//if null, short-circuit below
		var score_match_array = a.get(match_string)

		//does value pass confidence interval check
		if (score_match_array === null) {
			return {result: false, result_reason: "null confidence score",match_summary:match_summary}
		} else {

			//todo: pretty arbitrary lower bound here
			//should record some real life test results here
			let confidence_score_lb = .5

			//testing: only taking first match
			let firstMatchArray = score_match_array[0]
			if (firstMatchArray[0] < .5) {
				return {result: false, result_reason: `interval confidence < ${confidence_score_lb}`,match_summary:match_summary}
			} else {
				match_summary.match_result = firstMatchArray[1];
				return {result: true, result_reason: `interval confidence > ${confidence_score_lb}`,match_summary:match_summary}
			}
		}
	}
}
