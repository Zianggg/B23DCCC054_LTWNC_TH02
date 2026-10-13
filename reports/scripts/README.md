# Script đo

Các số liệu trong `BAO_CAO.md` được đo bằng các script này, chạy với Chrome đã cài trên máy.
Chúng cần `puppeteer-core` và `lighthouse`, không nằm trong dependency của dự án, nên cài ở một thư mục riêng:

```bash
mkdir ../measure-tools && cd ../measure-tools
npm init -y
npm install puppeteer-core@24 lighthouse@13.5.0
cp ../B23DCCC054_LTWNC_TH02/reports/scripts/*.mjs .
```

Đường dẫn Chrome mặc định là `C:/Program Files/Google/Chrome/Application/chrome.exe`; máy khác thì đặt biến `CHROME_PATH`.

| Script | Việc | Cần chạy trước |
| --- | --- | --- |
| `measure-renders.mjs <url> <nhãn> [số-lần]` | Đếm số lần render từng component (giống React DevTools Profiler) cho các thao tác: mở trang 10.000 bài, gõ `web`, hoàn thành 1 bài, ghim 1 bài, đổi theme. Ghi `renders-<nhãn>.json` vào `OUT_DIR` (mặc định thư mục hiện tại) | `npm run dev` (5173) và `npm run dev:before` (5174) |
| `lh-run.mjs <thư-mục> [số-lần]` | Chạy Lighthouse, xen kẽ bản trước (4174) và bản sau (4173), trang `/?stress` | `npm run build`, `npm run build:before`, `npm run preview`, `npm run preview:before` |
| `lh-summary.mjs <thư-mục>` | Tóm tắt các report, tính trung vị, ghi `summary.json` | `lh-run.mjs` |
| `capture-logger.mjs <url>` | Ghi lại log redux-logger khi thêm, hoàn thành, xoá một bài | `npm run dev` |

`measure-renders.mjs` cài một `__REACT_DEVTOOLS_GLOBAL_HOOK__` trước khi React chạy. Sau mỗi commit nó duyệt cây fiber
và đếm component có cờ `PerformedWork` (hoặc vừa mount) — đúng dữ liệu tab Profiler dùng để tô màu "đã render".
Nhánh nào React bỏ qua (cùng `child` với lần trước) thì không tính.
