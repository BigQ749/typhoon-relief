# Typhoon Relief Project Analysis

## 1. Current Project Structure

### Mini Program Pages

- `miniprogram/pages/index`: typhoon map and current typhoon summary.
- `miniprogram/pages/rescue`: nearby SOS map and rescue list.
- `miniprogram/pages/sos-publish`: SOS publishing form.
- `miniprogram/pages/sos-detail`: SOS detail, navigation, take/resolve actions.
- `miniprogram/pages/knowledge`: disaster-prevention article list.
- `miniprogram/pages/knowledge-detail`: article reading page.
- `miniprogram/pages/mine`: profile and placeholder personal center.

### Cloud Functions

- `cloudfunctions/syncTyphoon`: stores and returns typhoon path data.
- `cloudfunctions/publishSOS`: validates and creates SOS records.
- `cloudfunctions/nearbySOS`: finds nearby unresolved SOS records.
- `cloudfunctions/updateSOS`: updates SOS status to `rescuing` or `resolved`.
- `cloudfunctions/setupDB`: initializes collections.

### Data Collections

- `typhoons`: typhoon status, current point, path, forecast paths, wind circles.
- `sos_signals`: SOS location, photos, needs, description, status, priority, timestamps.

### Utilities

The generated project had no dedicated utility or service layer. Page scripts directly called cloud functions and duplicated formatting, distance and fallback logic.

## 2. Current Problems

### P0: Compile and Runtime Risks

- Many source files contained mojibake Chinese text, broken string literals, and malformed WXML closing tags.
- `miniprogram/app.json` contained unreadable tab labels and a broken permission description string.
- Several cloud functions had broken string literals and could fail to deploy or execute.
- `knowledge.js` included damaged article objects, making the page script invalid.
- Some WXML used unsupported or fragile expressions such as complex inline objects or array methods inside templates.

### P0: Map and Layout Issues

- Map pages relied on absolute overlays and full-height map styles without a clear flex container.
- Bottom rescue panel and floating SOS button could overlap content and tabBar on small screens.
- `index` used mixed `forecast` and `forecasts` fields, so cloud data and mock data were not normalized.

### P1: Architecture Issues

- Page scripts directly call cloud functions, upload files, map response data and format UI labels.
- SOS need values were stored as damaged display strings instead of stable codes such as `food_water`.
- Data shape was inconsistent across publish, nearby list and detail pages.
- No shared coordinate conversion module existed for WGS84 to GCJ02.

### P1: UI and Product Issues

- The visual direction was partially present, but text was unreadable and page states were incomplete.
- SOS status labels and action copy were unclear after encoding damage.
- Knowledge content was too large and brittle inside page JS.

### P2: Future Work

- Real typhoon data provider is still a placeholder.
- Reverse geocoding still relies on `wx.chooseLocation` instead of a Tencent Map key.
- Personal center records are placeholders.
- AI risk analysis and SOS summarization are only planned.

## 3. Refactor Plan

### P0

1. Restore valid UTF-8 Chinese text across app configuration, core pages and cloud functions.
2. Fix invalid WXML tags, invalid JS strings and invalid cloud function responses.
3. Normalize typhoon data to support `forecasts`, `path`, `wind_circles` and stable UI rendering.
4. Normalize SOS needs to code/value pairs and generate display labels in the UI.

### P1

1. Add `utils/coordinate.js`, `utils/formatter.js`, `services/typhoon.js`, `services/sos.js`, `services/user.js`, and `services/ai.js`.
2. Refactor page scripts to keep cloud calls and formatting out of WXML.
3. Improve map overlays, empty states, error states and form validation.
4. Update cloud functions to return consistent, user-safe data.

### P2

1. Replace mock typhoon data with a real provider.
2. Add dedicated user history cloud functions.
3. Add AI risk analysis and SOS summarization behind `services/ai.js`.
4. Replace placeholder tabBar icons with production icons.
