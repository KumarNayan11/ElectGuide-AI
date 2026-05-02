const assert = require('node:assert');
const intentService = require('../src/services/intent.service');
const electionKnowledge = require('../src/data/election_knowledge.json');

console.log('Running tests for intent.service.js...\n');

try {
    // Test 1: Timeline query
    const timelineResult = intentService.detectIntent('what is the election timeline?');
    assert.deepStrictEqual(timelineResult.data, electionKnowledge.election_timeline_detailed, 'Timeline query failed');
    assert.strictEqual(timelineResult.type, 'timeline', 'Timeline type failed');
    console.log('✅ Timeline query passed');

    // Test 2: Voting query
    const votingResult = intentService.detectIntent('tell me the voting steps');
    assert.deepStrictEqual(votingResult, electionKnowledge.voting_steps, 'Voting steps query failed');
    console.log('✅ Voting query passed');

    // Test 3: Eligibility query
    const eligibilityResult = intentService.detectIntent('who can vote in India?');
    assert.deepStrictEqual(eligibilityResult, electionKnowledge.eligibility_rules, 'Eligibility query failed');
    console.log('✅ Eligibility query passed');

    // Test 4: Election process query
    const processResult = intentService.detectIntent('explain the election process');
    assert.deepStrictEqual(processResult, electionKnowledge.election_process, 'Election process query failed');
    console.log('✅ Election process query passed');

    // Test 5: Unmatched query should return null
    const unmatchedResult = intentService.detectIntent('how to bake a cake?');
    assert.strictEqual(unmatchedResult, null, 'Unmatched query should return null');
    console.log('✅ Unmatched query passed');

    // Test 6: Voter registration query
    const registrationResult = intentService.detectIntent('how to register to vote?');
    assert.deepStrictEqual(registrationResult, electionKnowledge.voter_registration, 'Voter registration query failed');
    console.log('✅ Voter registration query passed');

    // Test 7: EVM explanation query
    const evmResult = intentService.detectIntent('how does evm work?');
    assert.deepStrictEqual(evmResult, electionKnowledge.evm_explanation, 'EVM explanation query failed');
    console.log('✅ EVM explanation query passed');

    // Test 8: FAQ queries
    const faqConductsResult = intentService.detectIntent('who conducts elections?');
    assert.deepStrictEqual(faqConductsResult, electionKnowledge.faq.who_conducts_elections, 'FAQ conducts query failed');
    console.log('✅ FAQ conducts query passed');

    const faqNoIdResult = intentService.detectIntent('can i vote without voter id?');
    assert.deepStrictEqual(faqNoIdResult, electionKnowledge.faq.can_i_vote_without_voter_id, 'FAQ no ID query failed');
    console.log('✅ FAQ no ID query passed');

    const faqTwiceResult = intentService.detectIntent('can i vote twice?');
    assert.deepStrictEqual(faqTwiceResult, electionKnowledge.faq.can_i_vote_twice, 'FAQ vote twice query failed');
    console.log('✅ FAQ vote twice query passed');

    // Test 9: Voting preparation query
    const preparationResult = intentService.detectIntent('how to prepare for voting?');
    assert.deepStrictEqual(preparationResult, electionKnowledge.voting_preparation, 'Voting preparation query failed');
    console.log('✅ Voting preparation query passed');

    // Test 10: Polling day process query
    const pollingDayResult = intentService.detectIntent('what happens on polling day?');
    assert.deepStrictEqual(pollingDayResult, electionKnowledge.polling_day_process, 'Polling day process query failed');
    console.log('✅ Polling day process query passed');

    // Test 11: Eligibility Checker queries
    const eligibilityGeneral = intentService.detectIntent('am i eligible to vote');
    assert.deepStrictEqual(eligibilityGeneral, electionKnowledge.eligibility_rules, 'General eligibility query failed');
    console.log('✅ General eligibility query passed');
    
    const eligibilityUnderage = intentService.detectIntent('am i eligible to vote i am 17 years old');
    assert.ok(typeof eligibilityUnderage === 'string' && eligibilityUnderage.includes('under 18'), 'Underage eligibility check failed');
    console.log('✅ Underage eligibility check passed');

    const eligibilityEligible = intentService.detectIntent('am i eligible to vote i am 25 years old indian citizen and registered');
    assert.ok(typeof eligibilityEligible === 'string' && eligibilityEligible.includes('You appear eligible to vote!'), 'Eligible voter check failed');
    console.log('✅ Eligible voter check passed');

    const eligibilityNotRegistered = intentService.detectIntent('am i eligible to vote i am 25 years old indian citizen but not registered');
    assert.ok(typeof eligibilityNotRegistered === 'string' && eligibilityNotRegistered.includes('Since you are not registered'), 'Not registered voter check failed');
    console.log('✅ Not registered voter check passed');

    // Test 12: Follow-up queries
    // First, set context using voting preparation
    intentService.detectIntent('how to prepare for voting?');
    const followupResult = intentService.detectIntent('what happens next?');
    assert.ok(typeof followupResult === 'string' && followupResult.includes('You were asking about "How to Prepare for Voting"'), 'Follow up generic check failed');
    console.log('✅ Follow-up context query passed');
    
    const followupStepResult = intentService.detectIntent('explain step 2');
    assert.ok(typeof followupStepResult === 'string' && followupStepResult.includes('Step 2 is:'), 'Follow up step check failed');
    console.log('✅ Follow-up step specific query passed');

    // Test 13: Polling booth finder
    const pollingBoothResult = intentService.detectIntent('polling booth finder');
    assert.deepStrictEqual(pollingBoothResult.data, electionKnowledge.polling_booth_finder, 'Polling booth finder query failed');
    assert.strictEqual(pollingBoothResult.type, 'steps', 'Polling booth type failed');
    console.log('✅ Polling booth finder query passed');

    // Test 14: Candidate info
    const candidateInfoResult = intentService.detectIntent('candidates in my constituency');
    assert.deepStrictEqual(candidateInfoResult.data, electionKnowledge.candidate_info, 'Candidate info query failed');
    assert.strictEqual(candidateInfoResult.type, 'steps', 'Candidate info type failed');
    console.log('✅ Candidate information query passed');

    // Test 15: Timeline rendering detection
    const timelineRenderingResult = intentService.detectIntent('phases of election');
    assert.strictEqual(timelineRenderingResult.type, 'timeline', 'Timeline rendering detection failed');
    console.log('✅ Timeline rendering detection passed');

    // Test 16: Help command
    const helpResult = intentService.detectIntent('help');
    assert.strictEqual(helpResult.title, 'Example Queries', 'Help command query failed');
    assert.strictEqual(helpResult.type, 'steps', 'Help command type failed');
    console.log('✅ Help command query passed');

    // Test 17: Demo command
    const demoResult = intentService.detectIntent('demo');
    assert.strictEqual(demoResult.title, 'Demo Queries', 'Demo command query failed');
    assert.strictEqual(demoResult.type, 'steps', 'Demo command type failed');
    console.log('✅ Demo command query passed');

    // Test 18: Election facts command
    const factResult = intentService.detectIntent('fact');
    assert.ok(typeof factResult === 'string' && factResult.length > 10, 'Election facts command failed');
    console.log('✅ Election facts command passed');

    console.log('\nAll tests passed successfully! 🎉');
} catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    process.exit(1);
}
