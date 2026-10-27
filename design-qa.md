# Design QA

- Source visual truth:
  - `gui-test-screenshots/ref-gpc/desktop-viewport.png` (1440 x 940)
  - `gui-test-screenshots/ref-gpc/mobile-viewport.png` (390 x 844)
- Implementation:
  - `gui-test-screenshots/fix-round2/home-desktop.png` (1440 x 940)
  - `gui-test-screenshots/fix-round2/home-domains-desktop.png` (1440 x 940)
  - `gui-test-screenshots/fix-round2/home-domains-mobile.png` (390 x 844)
  - `gui-test-screenshots/neo-round2/login.png` (1440 x 940)
  - `gui-test-screenshots/neo-round2/taxonomy.png`
- State: production-like light theme, desktop and mobile, reduced setup at 1x density.
- Full-view evidence: compared the reference's sky-to-sand gradient, halftone field, oversized headline, minimal metadata, scroll cue, and restrained controls against the Fixbox homepage.
- Focused evidence: inspected typography, search hierarchy, domain-card density, pointer spotlight, tilt state, admin navigation contrast, taxonomy form density, and login card centering.
- Interaction evidence: scroll progress advanced to 31.17% and 70.55%; a domain card received `data-fx-tilt`, moved to `2.10deg` on pointer move, and updated its spotlight coordinates. Browser console and failed requests: none.
- Responsive evidence: 1440 px and 390 px both reported `scrollWidth === clientWidth`, so no horizontal overflow was found.
- Findings: no actionable P0/P1/P2 visual mismatch remains. The implementation intentionally preserves Fixbox branding, copy, search behavior, domain taxonomy, and accessible reduced-motion fallbacks instead of copying the reference site's brand or content.
- Remaining test gap: the taxonomy CRUD routes were rendered and syntax-checked locally; destructive write-path tests against the production database were not executed before deployment.

Final result: passed

## Fixbox update, Store and Codex pages (2026-10-27)

- Coverage: 37 page/viewport states across the homepage, browse/search, existing BAT pages, Windows update enable/pause, Microsoft Store repair, Codex desktop installation, and Codex CLI installation at 1440, 768, 390, 360, and 320 px.
- Content checks: 82 articles passed content lint with 0 errors; front-matter round-trip ran 1,368 assertions; 23 articles now reference 18 BAT assets.
- Store prerequisite: the rendered guide places "Windows Update enabled and working" before `wsreset`; the BAT performs the same update-service gate before touching Store components.
- Script checks: all four new BAT files returned HTTP 200 and contained their expected commands, including scheduled update restoration, Store re-registration, Microsoft Store Codex discovery, and `npm install -g @openai/codex`.
- Responsive checks: every tested viewport reported `scrollWidth === clientWidth`; the mobile step-complete control was raised from a sub-38px rendering to a fixed 44px target. No controls overlapped, no console errors occurred, and no network requests failed.
- Visual evidence:
  - `gui-test-screenshots/fixboxs-bat/update-enable-desktop-1440.png`
  - `gui-test-screenshots/fixboxs-bat/update-pause-mobile-390.png`
  - `gui-test-screenshots/fixboxs-bat/store-bat-mobile-390.png`
  - `gui-test-screenshots/fixboxs-bat/codex-desktop-mobile-390.png`
  - `gui-test-screenshots/fixboxs-bat/codex-cli-desktop-1440.png`
- Findings: no actionable P0/P1/P2 layout or interaction issues remain in the reviewed states.

Final result: passed

## Fixbox BAT and mobile regression (2026-10-27)

- Coverage: 27 page/viewport states across the homepage, article pages, BAT cards, and source views at 1440, 768, 390, 360, and 320 px.
- BAT interaction: the download endpoint returned `fix-network-stack.bat` (1,493 bytes), and the copy control wrote the same full source to the clipboard.
- Mobile behavior: long command strings and BAT source wrap without page overflow; every tested viewport reported `scrollWidth === clientWidth`.
- Runtime health: no browser console errors or failed network requests were observed.
- Evidence:
  - `gui-test-screenshots/fixboxs-bat/home-desktop-1440.png`
  - `gui-test-screenshots/fixboxs-bat/home-mobile-320.png`
  - `gui-test-screenshots/fixboxs-bat/wifi-bat-mobile-390.png`
  - `gui-test-screenshots/fixboxs-bat/bat-card-desktop.png`
  - `gui-test-screenshots/fixboxs-bat/bat-source-mobile-390.png`
- Findings: no actionable P0/P1/P2 issues remain in the reviewed states.

Final result: passed
