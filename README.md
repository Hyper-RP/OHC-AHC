# Claude Code Sequential Workflow

Auto-runs 6 development phases in order. Each agent hands off output to the next.

## Setup (already done — this is for reference)
```bash
bash setup-claude-workflow.sh OHC-AHC
```

## Daily Use
```bash
claude                    # open Claude Code
/workflow-start           # begin Phase 1
/workflow-continue        # move to next phase
/workflow-status          # check progress
/workflow-pause           # save and exit
/workflow-resume          # pick up next session
```

## CLI State Manager
```bash
node .claude/scripts/workflow.js status        # show progress
node .claude/scripts/workflow.js start         # initialize
node .claude/scripts/workflow.js continue      # advance phase
node .claude/scripts/workflow.js goto 3        # jump to phase 3
node .claude/scripts/workflow.js reset         # start over
node .claude/scripts/workflow.js log "note"    # add session note
```
