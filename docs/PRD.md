# PRD — CMM21103 Final Project Game Transformation

## 1. Objective
Transform the existing birthday-themed platformer (main branch) into a complete
Mario-style platformer while preserving 100% of the original visual identity:
parallax mountain/cloud background, tileset atlas, ara character sprite, arcade font,
and overall art direction. Only the gameplay layer changes.

## 2. Working Principles
- One feature = one small commit -> test -> proceed. Never bundle two features.
- Original visuals are NOT redesigned. Only gameplay systems are added.
- Every step must be playable before moving to the next.
- Branch strategy: `build` branch carries incremental work; `main` stays untouched.

## 3. Scope: 6 Incremental Steps

| # | Feature | Acceptance Criteria | Est. |
|---|---------|--------------------|------|
| 1 | Coins + Score + HUD | Coins collectible (+10), score displayed top-left, correct counting | 0.5 day |
| 2 | Enemies + Stomp | Slime patrols, jump-on-top kills it (+50), side contact costs 1 heart, 3 hearts total | 0.5 day |
| 3 | Level Design + Goal | More challenging layout (pits, platforms), reaching the door completes the level | 1 day |
| 4 | Game Flow Screens | Title screen; 0 hearts = Game Over + retry; finishing = Win screen | 0.5 day |
| 5 | Audio | SFX: coin, stomp, hurt, win, game over | 0.25 day |
| 6 | Finalization | Title rename, mobile touch controls, Netlify deployment | 0.5 day |

## 4. Out of Scope
- Power-ups, boss fights, multiple worlds
- Character/background replacement or redesign
- Multiplayer, online leaderboards
- UI/menu overhaul

## 5. Definition of Done (rubric mapping)
- At least 3 multimedia elements -> graphics + text + audio + animation + interactivity (5)
- Evidence of process -> this PRD + step-by-step commit history + milestone screenshots
- Professional output -> live Netlify demo playable by lecturer on desktop and mobile
