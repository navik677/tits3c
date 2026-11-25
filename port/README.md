# Порт русика ZoG (PC) на Vita (rePatch)

## Структура
- `ru_pc/`, `ru_pc_x/`, `ru_pc_dec/` — інсталятор ZoG розпакований, `.dat` розпаковані, Falcom BZ розпаковано.
- `vita/data`, `vita/data0` — розпаковані `repatch\...\data*.psarc`.
- `out/msg_ru/` — перекладені `msg/*.mbin` (діалоги).
- `out/rePatch/PCSG00490/gamedata/data.psarc` — зібраний архів із підміненими `data_3rd/msg/*.mbin`.
- `tools/` — скрипти (Node.js).

## Кодування PC-русика
Однобайтове: малі `а..п` = 0x91..0xA1, `р..я` = 0xA4..0xB3 (0xA2, 0xA3 порожні), великі `А..П` = 0xB4..0xC4, `Р..Я` = 0xC5..0xD4 (з `ё`/`Ё` після `е`/`Е`).
Відображення: `tools/dec.js`.

## Кодування Vita
Shift-JIS. Кирилиця — однобайтові слоти півширинної катакани: `А..Я`=0xA0..0xBF, `а..я`=0xC0..0xDF (Ё→Е). Шрифт патчиться `tools/font_patch.js`. Деталі — `HANDOFF.md`.

## Стиснення
Falcom BZ mode 2, потік з байта 2 файла (`tools/falcz.js`).

## Скрипти
- `psarc_extract.js <psarc> <outDir>` — розпакувати PSARC (zlib).
- `psarc_build.js <orig.psarc> <overlayRoot> <out.psarc> <prefix>` — зібрати PSARC із підмінами.
- `conv_msg.js <outDir>` — конвертувати діалоги (Vita-структура + російський текст із PC).
- `font_patch.js <in.fnt> <out.fnt>` — кирилиця в однобайтові слоти VFNT.
- `sjis.js` — енкодер Unicode → байти гри.
- `align.js` — зіставлення реплік за кодом обличчя + кількістю рядків.

## Статус
- Діалоги `msg/*.mbin`: 15746 із 19720 записів зіставлено, решта лишається англійською.
- Таблиці `text/t_*._dt`: не конвертовані.
- Діалоги російською показуються в грі (Vita3K), але рядки задовгі — потрібне автоперенесення.
