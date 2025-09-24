# Character Manual Testing Protocol

## Pre-Testing Setup:
1. Load character into game world at specified location
2. Set character stats according to profile
3. Enable logging for this testing session
4. Review character's story integration requirements

## Testing Checklist:
- [ ] **Dialogue Testing**
  - [ ] Greeting feels natural and in-character
  - [ ] Subsequent meeting dialogue progresses appropriately
  - [ ] Quest-related dialogue provides clear objectives
  - [ ] Lore sharing adds value without contradicting existing story
  - [ ] Speech patterns match character personality

- [ ] **Quest Mechanics**
  - [ ] Quest can be properly initiated
  - [ ] Objectives are clear and achievable
  - [ ] Rewards are granted correctly
  - [ ] Quest progression saves properly
  - [ ] Quest completion triggers appropriate responses

- [ ] **Faction Interactions**
  - [ ] Faction allegiance displays correctly
  - [ ] Reputation changes work as intended
  - [ ] Character responds appropriately to faction standing
  - [ ] Inter-faction conflicts are handled properly

- [ ] **Service Integration**
  - [ ] All offered services function correctly
  - [ ] Economic transactions process properly
  - [ ] Service availability matches character status

- [ ] **Story Consistency**
  - [ ] Character doesn't contradict established lore
  - [ ] Information provided aligns with world state
  - [ ] Relationships with other NPCs make sense
  - [ ] Character advances intended storylines

- [ ] **Technical Stability**
  - [ ] No crashes or errors during interactions
  - [ ] Save/load preserves character state
  - [ ] AI behavior (if any) functions as intended

## Special Testing Notes by Character:

### Elder Thaddeus
- Test political dialogue trees thoroughly
- Verify faction reputation changes
- Check quest impact on town relations

### Sister Morwyn
- Test healing and blessing services
- Verify divine magic interactions
- Check mysterious dialogue about the Forgotten

### Razorclaw
- Test unique Beast-kin dialogue patterns
- Verify wilderness tracking services
- Check acceptance/rejection scenarios

### The Veiled Scholar
- **IMPORTANT**: Test hidden agenda mechanics carefully
- Verify that corruption effects are delayed/hidden appropriately
- Check that true allegiance isn't immediately obvious

### Grizelda Ironfoot
- Test mining area access grants
- Verify technology repair services
- Check restorationist vs adaptationist dialogue conflicts

## Approval Process:
1. Complete all testing checklist items
2. Document any issues found in `testing_results.log`
3. Update character profile with testing results
4. If approved: Move JSON file to "approved_for_auto" folder
5. If issues found: Document fixes needed and leave in "ready_for_testing"
6. Log approval/rejection in `implementation_logs/character_deployment.log`

## Post-Approval Steps:
1. Configure auto-player settings if applicable
2. Add character to active rotation schedule
3. Monitor initial auto-play sessions for issues
4. Document player interactions and feedback

## Issue Reporting Format:
```
[DATE] [CHARACTER_ID] [TESTER_NAME]
Issue Type: [Dialogue/Quest/Technical/Story]
Severity: [Critical/Major/Minor]
Description: [Detailed description of issue]
Steps to Reproduce: [If applicable]
Suggested Fix: [If known]
Status: [Open/In Progress/Resolved]
```