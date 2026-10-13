# LTWNC — Bài thực hành 02 — Nâng cấp Student Deadline Tracker

Sinh viên: **B23DCCC054**. Dự án clone từ bài thực hành 01 (`B23DCCC054_LTWNC_TH01`, commit `1392ba5`), giữ Redux Toolkit và các type của Buổi 1, thêm:

- Phần A: ghim bài bằng Zustand, theme sáng/tối bằng Context riêng, `redux-logger` chỉ ở development.
- Phần B: chế độ stress test 10.000 bài, bốn kỹ thuật tối ưu, đo trước/sau bằng Profiler và Lighthouse.
- Phần C: Jest + ts-jest + React Testing Library, 64 test, coverage `src/features` 94,87% statements.
- Giao diện dùng shadcn/ui (Tailwind CSS v4, Radix) với theme mặc định (neutral, font Inter) và bố cục ứng dụng: Sidebar điều hướng, header có breadcrumb, bảng bài tập theo mẫu Tasks, trang Thống kê dạng dashboard.

Cách chạy và cấu trúc thư mục: [README.md](README.md).

---

## Phần A — Quản lý state

### A1. Ghim bài tập bằng Zustand

`src/features/pins/usePinStore.ts`:

```ts
interface PinState {
  pinnedIds: string[]
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
}
```

- `AssignmentList` đọc `pinnedIds` và gọi `sortPinnedFirst` trong cùng `useMemo` với phần lọc: bài đã ghim luôn ở đầu danh sách, thứ tự bên trong mỗi nhóm giữ nguyên. Đầu danh sách ghi "N bài đang ghim".
- Không đưa vào Redux vì đây là trạng thái giao diện: không cần time-travel, không cần serialize, chỉ danh sách và thẻ dùng tới. Một slice Redux sẽ kéo theo action, reducer và một nhóm log redux-logger cho mỗi lần bấm ghim.
- `isPinned(id)` đọc state tại lúc gọi (trong event handler, trong test). Khi render, component subscribe `pinnedIds`; `isPinned` là hàm không đổi tham chiếu, subscribe nó sẽ không render lại khi ghim/bỏ ghim.

### A2. Theme sáng/tối bằng Context nâng cao

`src/features/theme/ThemeContext.tsx`, nút đổi theme ở `ThemeToggle.tsx`.

- Context riêng, chỉ chứa `{ theme, setTheme, toggleTheme }`, không gộp với state nào khác.
- `value` bọc `useMemo([theme, toggleTheme])`, `toggleTheme` bọc `useCallback`. Provider có render lại vì lý do khác thì consumer cũng không bị kéo theo.
- `ThemeProvider` bọc ngoài cùng trong `main.tsx` và nhận phần còn lại qua `children`. Khi theme đổi, `children` vẫn là cùng một element nên React bỏ qua cả cây `<Provider>…<App/>`; chỉ component gọi `useTheme()` — nút `ThemeToggle` — render lại.
- Màu đổi bằng class `dark` trên `<html>` và CSS variables của shadcn/ui, nên các thẻ bài không cần render lại để đổi màu.
- Một script nhỏ trong `index.html` đặt class trước khi React mount, tải lại trang không bị nháy từ sáng sang tối.

**Kiểm chứng bằng Profiler.** Lần commit khi bấm đổi theme chỉ có `ThemeProvider`, `ThemeToggle`, `Button` và icon `Sun` render; mọi component khác "did not render". Kết quả giống nhau ở cả 6 lần đo (3 lần mỗi bản, mục "Đổi theme" trong bảng của Phần B). Test `đổi theme không render lại component không dùng theme (đo bằng <Profiler>)` trong `ThemeContext.test.tsx` kiểm tra điều này tự động bằng API `<Profiler>` của React.

### A3. Middleware Redux: redux-logger

`src/app/store.ts`:

```ts
const isDevelopment = process.env.NODE_ENV === 'development'

function devOnlyMiddleware(): Middleware[] {
  if (!isDevelopment) return []
  return [createLogger({ collapsed: true, duration: true })]
}

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(devOnlyMiddleware()),
  })
}
```

- Vite thay `process.env.NODE_ENV` bằng hằng số: `"development"` khi `npm run dev`, `"production"` khi `npm run build`. Jest chạy với `"test"`, nên test không in log.
- `redux-logger` chỉ phát hành bản UMD, Rollup không biết gói này không có side effect nên giữ nguyên cả gói trong bundle production dù không gọi tới. `vite.config.ts` khai báo điều đó (`build.rollupOptions.treeshake.moduleSideEffects`), bundle production không còn chứa logger: chuỗi `prev state` không còn trong `dist/assets/*.js` (bundle đầu nhẹ đi khoảng 11 KB).
- Store tách thành `setupStore(preloadedState?)` để mỗi test tạo store riêng.
- `fetchAssignments` có `condition`: StrictMode chạy effect hai lần lúc mount, lần gọi thứ hai bị huỷ, log chỉ có một `fetchAll/pending`.

Log thật khi thêm, hoàn thành và xoá một bài (ghi bằng `reports/scripts/capture-logger.mjs`, bản đầy đủ ở `reports/redux-logger-console.txt`):

```
action assignments/addAssignment @ 14:26:28.662 (in 0.80 ms)
  prev state {"assignments":{"items":"[6 bài]","status":"succeeded","error":null,"filter":"all"}}
  action    {"type":"assignments/addAssignment","payload":{"course":"Hệ điều hành","title":"Bài tập lập lịch CPU","dueDate":"2026-10-20","priority":"medium","id":"Yb5jgLFtdCp7eWDrRxw_e","completed":false}}
  next state {"assignments":{"items":"[7 bài]","status":"succeeded","error":null,"filter":"all"}}
action assignments/toggleComplete @ 14:26:29.310 (in 0.20 ms)
  …
action assignments/removeAssignment @ 14:26:29.954 (in 0.50 ms)
  …
  next state {"assignments":{"items":"[6 bài]",…}}
```

---

## Phần B — Tối ưu hiệu năng

### B1. Chế độ stress test

- Nút **Tạo 10.000 bài tập mẫu** trên trang Danh sách dispatch `seedAssignments(10_000)`. Dữ liệu sinh trong `prepare` của action (`generateAssignments` ở `src/features/assignments/stressData.ts`), reducer vẫn là hàm thuần.
- Đề có nhắc "hàm sinh dữ liệu gợi ý bên dưới" nhưng bản đề em nhận được không kèm hàm đó, nên em tự viết theo type `Assignment`: 8 môn, 6 loại bài, hạn nộp trải từ 30 ngày trước tới 59 ngày sau, 1/5 số bài đã hoàn thành, id cố định `stress-1` … `stress-10000`. Có hàm gợi ý của giảng viên thì chỉ cần thay thân `generateAssignments`.
- `?stress` (hoặc `?stress=N`) trên URL mở trang với sẵn 10.000 bài. Lighthouse tải lại trang trước khi đo nên không bấm nút được; tham số này để đo đúng trang 10.000 bài.

### B2. Cách đo

Hai bản cùng giao diện, cùng store, cùng Phần A; chỉ khác bốn kỹ thuật của Phần B:

- **Trước**: `npm run dev:before` / `npm run build:before`. Vite chạy `--mode before`, `@/App` trỏ sang `src/before/App.tsx`: danh sách `.map()` đủ mọi bài, thẻ không `memo`, handler là arrow function mới mỗi lần render, lọc ngay trong thân render không `useMemo`, không debounce, trang Thống kê import tĩnh.
- **Sau**: `npm run dev` / `npm run build`.

**Profiler (số lần render).** Đo trên bản dev vì Profiler chỉ chạy ở dev. Script `reports/scripts/measure-renders.mjs` cài `__REACT_DEVTOOLS_GLOBAL_HOOK__` trước khi React chạy và đếm component render ở mỗi commit theo cờ `PerformedWork` của fiber — cùng dữ liệu tab Profiler dùng để tô màu. Độ trễ thao tác lấy từ Event Timing API (cơ sở của chỉ số INP).

| Mục | Giá trị |
| --- | --- |
| Trình duyệt | Chrome 155 headless, cửa sổ 1440×900 (có sidebar), StrictMode bật |
| Dữ liệu | `/?stress`, 10.000 bài |
| Kịch bản | mở trang → gõ `web` vào ô tìm kiếm, 150 ms mỗi phím, chờ 1,2 s → xoá từ khoá → đánh dấu hoàn thành 1 bài → ghim 1 bài → đổi theme |
| Số lần | 3 lần mỗi bản. Số lần render giống hệt nhau giữa các lần; thời gian lấy trung vị |
| Kết quả thô | `reports/profiler/renders-before.json`, `renders-after.json` |

**Lighthouse.** Đo trên bản build (`vite preview`), không đo dev server.

| Mục | Giá trị |
| --- | --- |
| Công cụ | Lighthouse 13.5.0 CLI, Chrome 155 headless |
| Form factor | mobile 412×823, throttling `simulate` (RTT 150 ms, 1,6 Mbps, CPU chậm 4 lần — cùng mặc định tab Lighthouse của DevTools) |
| Trang | `http://localhost:4174/?stress` (trước), `http://localhost:4173/?stress` (sau) |
| Số lần | 3 lần mỗi bản, xen kẽ trước/sau, ngày 13/10/2026 |
| Category | Performance |

File nộp là lần có TBT nằm giữa: `reports/lighthouse-before.html` (lần 2) và `reports/lighthouse-after.html` (lần 2), kèm `.json`. Sáu lần thô và `summary.json` ở `reports/lighthouse/`.

### B3. Đo trước khi tối ưu

1. **Gõ vào ô tìm kiếm.** Mỗi phím là một commit lọc lại 10.000 bài và render lại mọi thẻ khớp. Gõ `web` (3 phím) → **3.750 lần render `AssignmentCard`** (3 × 1.250 bài thuộc môn Lập trình web), phím chậm nhất 1.344 ms. Phím đầu còn phải gỡ 8.750 thẻ khỏi DOM.
2. **DOM.** Mở trang mount đủ 10.000 thẻ: 314.808 node DOM, React mất 4,39 s cho lần render đó (bản dev). Lighthouse mobile: **Performance 40**, TBT 9.110 ms.
3. **Một thay đổi nhỏ làm render lại tất cả.** Đánh dấu hoàn thành hoặc ghim một bài → cả 10.000 thẻ render lại, vì thẻ không `memo` và handler là hàm mới mỗi lần. Cú click mất 5,3 s / 5,5 s.
4. **Đổi theme.** Context đã cô lập đúng: React chỉ mất 1 ms, chỉ `ThemeProvider` và nút render. Nhưng cú click vẫn mất **7,7 s**: đổi class `dark` buộc trình duyệt tính lại style cho 314.808 node. Vấn đề này nằm ở số node DOM, không nằm ở Context.
5. **Bundle.** Trang Thống kê (Card, Table, Progress, Badge của shadcn) nằm chung bundle đầu của trang Danh sách: 486,2 KB (gzip 159,3 KB).

### B4. Bốn kỹ thuật, đặt đúng chỗ

**1. Virtualization bằng `react-window` — cho vấn đề 2 và 4.**
`AssignmentList.tsx` dùng `List` của react-window v2: chiều cao dòng cố định (60 px từ `lg`, 68 px dưới `lg`, đổi theo `useMediaQuery`), `overscanCount` 4, `rowKey` theo id. Chỉ dòng trong khung nhìn được mount: **14 thẻ, 585 node DOM** (cả sidebar và header) thay vì 10.000 thẻ, 314.808 node. Đổi theme còn 40 ms vì trình duyệt chỉ tính lại style cho vài trăm node.

**2. `React.memo` cho `AssignmentCard` + `useCallback` cho handler — cho vấn đề 3.**
`AssignmentCard` bọc `memo`; `handleToggleComplete`, `handleRemove` bọc `useCallback([dispatch])`; `togglePin` lấy từ Zustand vốn đã ổn định. react-window v2 cũng tự memo dòng và so sánh nông `rowProps`, nên handler đổi tham chiếu sẽ làm mọi dòng render lại. Hoàn thành hoặc ghim một bài giờ chỉ render **đúng 1 thẻ**. `rowKey` theo id giúp bài vẫn hiện sau khi lọc hoặc ghim giữ nguyên instance và được memo bỏ qua.

**3. `useDebounce` 300 ms + `useMemo` cho phần lọc — cho vấn đề 1.**
`AssignmentsPage.tsx`: ô input cập nhật theo từng phím, danh sách nhận từ khoá qua `useDebounce(keyword, 300)`. `AssignmentList` lọc + tìm + xếp bài ghim trong `useMemo([items, filter, keyword, pinnedIds])`. Gõ liên tục thì không lọc; ngừng 300 ms mới lọc một lần. Gõ `web` còn **12 lần render `AssignmentCard`**, phím chậm nhất 16 ms.

**4. `React.lazy` + `Suspense` cho trang Thống kê — cho vấn đề 5.**
`App.tsx`: `const StatsPage = lazy(loadStatsPage)`, fallback `StatsPageSkeleton` (nằm trong bundle chính nên hiện ngay). Trang Thống kê đếm số bài đã xong, quá hạn, còn hạn và thống kê theo môn bằng `calcStats`. Chunk riêng **12,1 KB (gzip 4,1 KB)** chỉ tải khi mở `/thong-ke`. Link "Thống kê" trên sidebar gọi `loadStatsPage()` khi rê chuột hoặc focus, nên lúc bấm chunk thường đã có sẵn. Chunk nhỏ vì Card, Tooltip, Badge cũng được sidebar và danh sách dùng nên nằm sẵn ở bundle đầu; phần thật sự riêng của trang Thống kê chỉ còn Table, Progress và logic trang.

Những chỗ cố ý **không** tối ưu:

- Không `memo` toolbar, `FilterTabs`, header. Chúng render rẻ, và toolbar nhận `keyword` mới ở mỗi phím, so sánh props chỉ tốn thêm.
- Bỏ `useDeadline` (một `useMemo` trong từng thẻ) của bản 01. Thẻ đã `memo` ở cấp component; `useMemo` bên trong chỉ thêm chi phí cho mỗi thẻ.
- Không `useMemo` cho `rowProps`: react-window v2 đã so sánh nông từng giá trị bên trong.
- Không `useMemo` cho phép tính rẻ như số bài đang ghim.

### B5. Bảng so sánh trước/sau

**Profiler** (bản dev, 10.000 bài, trung vị 3 lần):

| Thao tác | Chỉ số | Trước | Sau |
| --- | --- | --- | --- |
| Gõ `web` vào ô tìm kiếm | **Số lần render `AssignmentCard`** | **3.750** | **12** |
|  | Số commit | 3 | 6 |
|  | Thời gian render React, cộng các commit | 1.244 ms | 70 ms |
|  | Phím chậm nhất | 1.344 ms | 16 ms |
| Mở trang | `AssignmentCard` được render | 10.000 | 14 |
|  | Số node DOM | 314.808 | 585 |
|  | Thời gian render React | 4.386 ms | 129 ms |
| Đánh dấu hoàn thành 1 bài | `AssignmentCard` render lại | 10.000 | 1 |
|  | Độ trễ cú click | 5.320 ms | 40 ms |
| Ghim 1 bài | `AssignmentCard` render lại | 10.000 | 1 |
|  | Độ trễ cú click | 5.512 ms | 32 ms |
| Đổi theme | Component render lại | `ThemeProvider`, `ThemeToggle`, `Button`, icon | như bản trước |
|  | Thời gian render React | 1 ms | 1 ms |
|  | Độ trễ cú click | 7.696 ms | 40 ms |

Bản sau có nhiều commit hơn khi gõ nhưng mỗi commit nhẹ. Ghi từng commit của một lần gõ `web`:

| Commit | Lúc (từ phím đầu) | Render | Component render |
| --- | --- | --- | --- |
| 1, 3, 4 — ba phím `w`, `e`, `b` | 9 ms, 176 ms, 345 ms | 5–6 ms | trang, toolbar, ô input, `AssignmentList`, `List`; không dòng nào |
| 5 — debounce hết 300 ms | 718 ms | 50 ms | như trên + 14 `AssignmentRow`, 12 `AssignmentCard` |
| 2, 6 | 16 ms, 736 ms | 0 ms | không component nào |

Số 12 đo với tốc độ gõ 150 ms mỗi phím. Gõ chậm hơn 300 ms mỗi phím thì debounce hết hạn sau từng phím và danh sách lọc nhiều lần hơn.

**Lighthouse** (bản build, mobile, `?stress`):

| Chỉ số | Trước (3 lần) | Trung vị trước | Sau (3 lần) | Trung vị sau |
| --- | --- | --- | --- | --- |
| **Performance** | 37, 40, 41 | **40** | 89, 89, 90 | **89** |
| FCP | 2,7 s, 2,7 s, 2,7 s | 2,7 s | 2,7 s, 2,9 s, 2,7 s | 2,7 s |
| LCP | 5,7 s, 5,0 s, 4,9 s | 5,0 s | 3,0 s, 2,9 s, 2,9 s | 2,9 s |
| TBT | 11.540 ms, 9.110 ms, 8.630 ms | **9.110 ms** | 130 ms, 100 ms, 100 ms | **100 ms** |
| CLS | 0,019, 0,019, 0,019 | 0,019 | 0,019, 0,019, 0,019 | 0,019 |
| Speed Index | 8,9 s, 7,5 s, 7,2 s | 7,5 s | 2,7 s, 2,9 s, 2,7 s | 2,7 s |
| TTI | 14,7 s, 12,2 s, 11,7 s | 12,2 s | 3,1 s, 3,1 s, 3,1 s | 3,1 s |
| Main-thread work | 28,3 s, 23,5 s, 22,5 s | 23,5 s | 0,9 s, 0,7 s, 0,7 s | 0,7 s |
| Số phần tử DOM | 314.754 | 314.754 | 499 | 499 |
| FCP thực, không throttle | 4.150 ms, 3.501 ms, 3.343 ms | 3.501 ms | 301 ms, 211 ms, 264 ms | 264 ms |

**Bundle** (`npm run build` / `npm run build:before`):

| File JS | Trước | Sau |
| --- | --- | --- |
| Bundle đầu (trang Danh sách) | 486,2 KB, gzip 159,3 KB | 486,2 KB, gzip 160,5 KB |
| `StatsPage-*.js` | nằm trong bundle đầu | 12,1 KB, gzip 4,1 KB, chỉ tải khi mở `/thong-ke` |

Bundle đầu hai bản gần bằng nhau: bản sau bớt phần Thống kê nhưng thêm `react-window` (khoảng 4 KB gzip).

### B6. Nhận xét

- Chỉ số đề bài yêu cầu ghi lại: **render `AssignmentCard` khi gõ tìm kiếm 3.750 → 12**, **Performance 40 → 89**.
- TBT giảm từ 9.110 ms xuống 100 ms, main-thread work từ 23,5 s xuống 0,7 s. Phần lớn đến từ virtualization: bản trước có một long task render 10.000 thẻ ngay lúc mở trang.
- FCP mô phỏng hai bản bằng nhau (2,7 s), nhưng FCP thực khác hẳn: bản trước 3,5 s mới vẽ nội dung đầu tiên vì long task chặn lần vẽ đầu, bản sau 264 ms. Lighthouse (chế độ `simulate`) đưa long task đó vào TBT thay vì FCP.
- Code-splitting trang Thống kê chỉ bớt 12 KB khỏi lần tải đầu, vì các component dùng chung (Card, Tooltip, Badge) đã nằm sẵn trong bundle đầu do sidebar và danh sách dùng. Kỹ thuật vẫn đúng chỗ (trang ít vào, tách được), nhưng lợi ích về dung lượng nhỏ.
- 89 điểm còn lại bị giới hạn bởi FCP/LCP 2,7–2,9 s trên mạng 4G chậm mô phỏng: 160 KB JS gzip + 15 KB CSS + font Inter. Muốn tăng tiếp thì phải tách nhỏ bundle đầu (ví dụ lazy dialog Thêm bài tập) hoặc bỏ web font; em chưa làm vì ngoài phạm vi bốn kỹ thuật của đề.
- CLS 0,019 ở cả hai bản (dưới ngưỡng tốt 0,1), giống nhau giữa hai bản nên đến từ khung trang (sidebar, font), không phải từ danh sách; danh sách có chiều cao dòng cố định.

---

## Phần C — Kiểm thử

### Cấu hình

| File | Nội dung |
| --- | --- |
| `jest.config.ts` | `testEnvironment: 'jsdom'`, transform `ts-jest`, alias `@/` → `src/`, file CSS → object rỗng, `coverageThreshold` cho `./src/features/` ≥ 70% statements |
| `tsconfig.test.json` | Kế thừa cấu hình app, đổi sang CommonJS cho Jest; bật kiểm tra kiểu (`isolatedModules: false`), test sai kiểu thì fail |
| `src/test/polyfills.ts` | `TextEncoder` cho react-router trong jsdom |
| `src/test/setupTests.ts` | `@testing-library/jest-dom`, `matchMedia` giả, reset store Zustand và localStorage sau mỗi test |
| `src/test/renderWithProviders.tsx` | Render với store Redux riêng + `MemoryRouter`, trả về `user` của userEvent |

`npm test` chạy `jest --coverage`. Coverage dưới ngưỡng thì lệnh trả mã lỗi 1 — đã thử với ngưỡng 99%: `Jest: Coverage for statements (94.78%) does not meet "./src/features/" threshold (99%)` (số đo ở lần thử đó, trước khi đổi giao diện).

### 64 test theo bốn loại

| Loại | Đề yêu cầu | Số test | File và nội dung chính |
| --- | --- | --- | --- |
| Unit | 5 | 32 | `assignmentUtils.test.ts` (14): `calcDaysLeft` (còn hạn, hôm nay, quá hạn, qua tháng/năm, không phụ thuộc giờ), `isOverdue` (biên: hạn đúng hôm nay chưa tính quá hạn; bài xong không quá hạn), `calcStats` (biên: danh sách rỗng không chia cho 0; đếm theo môn), lọc, tìm không dấu, xếp bài ghim. `assignmentsSlice.test.ts` (11): reducer thêm/toggle/xoá/lọc/seed, biên id không tồn tại giữ nguyên state cùng tham chiếu, pending/fulfilled/rejected, `condition` chặn fetch trùng. `stressData.test.ts` (5), `usePinStore.test.ts` (2) |
| Component (RTL + userEvent) | 4 | 22 | `AssignmentCard.test.tsx` (6): hiển thị, quá hạn/đã xong, nút hoàn thành, nút mở lại, nút ghim + `aria-pressed`, nút xoá. `AssignmentForm.test.tsx` (4): validate form trống, chỉ khoảng trắng, submit hợp lệ (trim, lên đầu, reset, `onSuccess`), Hủy. `AssignmentsPage.test.tsx` (4), `StatsPage.test.tsx` (4), `ThemeContext.test.tsx` (4) |
| Bất đồng bộ | 2 | 7 | `AssignmentList.test.tsx` với `assignmentsApi` mock: **đang tải → thành công** (promise tự điều khiển để thấy rõ trạng thái đang tải), **lỗi → Tải lại → thành công**; cùng file: ghim đưa bài lên đầu, hoàn thành/xoá qua handler, hai trạng thái rỗng, 10.000 bài chỉ render dưới 20 thẻ |
| Hook | 1 | 3 | `useDebounce.test.ts` với `renderHook` + fake timers: giá trị mới đúng 300 ms, gõ liên tục chỉ ra giá trị cuối, huỷ timer khi unmount |

### Coverage `src/features` (`npm test`)

| Thư mục | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Tất cả** | **94,87%** | 87,83% | 88,97% | 95,69% |
| `assignments` | 96,28% | 90,6% | 92,63% | 96,76% |
| `pins` | 100% | 100% | 100% | 100% |
| `stats` | 82,45% | 63,63% | 61,11% | 86% |
| `theme` | 100% | 93,75% | 100% | 100% |

`assignmentsApi.ts` thấp (23%) vì luôn bị mock trong test bất đồng bộ; `loadStatsPage.ts` là một dòng import động chỉ chạy trong trình duyệt.

---

## Ảnh chụp cần nộp

Các bước để chụp ảnh trên máy (cài extension React Developer Tools cho Chrome trước):

1. **Profiler trước tối ưu, gõ tìm kiếm.** `npm run dev:before`, mở `http://localhost:5174/?stress`, DevTools → ⚛ Profiler → Record → gõ `web` → Stop. Chụp danh sách commit và Ranked chart của một commit (toàn `AssignmentCard`).
2. **Profiler sau tối ưu, gõ tìm kiếm.** `npm run dev`, `http://localhost:5173/?stress`, làm giống bước 1. Ba commit đầu `AssignmentCard` màu xám (did not render), commit sau debounce chỉ có vài thẻ.
3. **Profiler khi đổi theme.** Record → bấm nút mặt trăng/mặt trời → Stop. Flamegraph chỉ tô màu `ThemeProvider` → `ThemeToggle`, phần còn lại xám.
4. **Console redux-logger.** `npm run dev`, mở Console, thêm một bài, đánh dấu hoàn thành, xoá nó, mở các nhóm log và chụp.
5. **Lighthouse.** `npm run build && npm run preview` và `npm run build:before && npm run preview:before`. Mở `http://localhost:4174/?stress` và `http://localhost:4173/?stress` **trong cửa sổ ẩn danh** (extension React DevTools làm chậm trang), DevTools → Lighthouse → Navigation, Mobile, Performance → Analyze.

Số liệu trên máy khác sẽ lệch về thời gian; số lần render phải giống bảng ở B5.
