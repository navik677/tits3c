# HANDOFF: порт русика ZoG (PC) → PS Vita «Trails in the Sky the 3rd» (PCSG00490)

Репозиторій: https://github.com/navik677/tits3c (лише інструменти й документація; ігрові дані не залиті).

## Мета
Перенести російський переклад ZoG з PC-версії на Vita-версію (English v1.0, NoNpDrm) через плагін rePatch:
файли в `ux0:rePatch/PCSG00490/` перекривають вміст гри.

## Що вже зроблено
- Розпаковано інсталятор ZoG (Inno Setup 5.5.7, через innoextract) → `ED6_DT*.dat/.dir` (формат LB DIR, запис 36 байт, заголовок 16).
- Файли в DT21/22/30/3A стиснуті Falcom BZ mode 2 (потік з байта 2). Декомпресор: `port/tools/falcz.js`.
- Кодування PC-русика (1 байт) описано в `port/README.md` та `tools/dec.js` / `enc.js`.
- Vita-архіви `repatch/PCSG00490/gamedata/data*.psarc` — звичайний PSARC v1.4 zlib (`app/` версії зашифровані, їх не чіпати). Розпаковка: `tools/psarc_extract.js`.
- Діалоги Vita `data_3rd/msg/*.mbin` (UTF-8) зіставлені з PC-діалогами за (id обличчя `#NNNNF`, кількість рядків) — `tools/align.js`, `tools/pc_dialogs.js`.
- `tools/conv_msg.js` зібрав 346 файлів: 15746 реплік російською, 3974 лишилися англійськими (не зіставились).
- `tools/psarc_build.js` перезібрав `data.psarc` з підміненими msg (≈1,46 ГБ, цілісність перевірена).
- Гру з патчем скопійовано в сховище Vita3K (`...\Vita3K\Vita3K\ux0\app\PCSG00490`).

## НЕ перевірено / блокер
**Головне невідоме: чи показує Vita кирилицю з UTF-8.** У грі не тестувалось.
- Vita3K v0.2.1 потребує прошивки (File → Install Firmware, офіційний PSVUPDAT.PUP). На цьому ПК у користувача немає прав адміна, тож встановити/запустити тест тут не вийшло. Робити на іншому ПК або на реальній Vita.
- Computer-use не бачить Vita3K як встановлену програму, тому керувати його GUI я не можу; кроки в GUI робить користувач.
- Шрифт: `system/ucs2jis.bin` мапить 66 кириличних гліфів U+0410..U+044F (без Ukrainian і/ї/є/ґ). Якщо у грі квадрати або крякозябри, шукати інше кодування або патчити `ucs2jis.bin` / `vitafont2bit.fnt`.

## Як відновити робоче середовище на новому ПК
Потрібні: Node.js, оригінальна гра (`app/`), fan-патч `repatch/PCSG00490/{eboot.bin,gamedata/data.psarc,data0.psarc}`, інсталятор `LegendofHeroesTrailsintheSky3rd_ZoG.exe`, innoextract.

1. `innoextract -d port/ru_pc LegendofHeroesTrailsintheSky3rd_ZoG.exe`
2. `node port/tools/dat_extract.js <папка з ED6_DT*.dat+dir> port/ru_pc_x`
3. Розпакувати DT21/22/30/3A через `falcz.js` (`decompress(buf, 2)`) у `port/ru_pc_dec/`.
4. `node port/tools/psarc_extract.js repatch/PCSG00490/gamedata/data.psarc port/vita/data` (і так само data0).
5. `node tools/conv_msg.js out/msg_ru` (з папки `port`).
6. `node tools/psarc_build.js ../repatch/PCSG00490/gamedata/data.psarc out/msg_ru out/rePatch/PCSG00490/gamedata/data.psarc data_3rd/msg/`
7. Покласти результат у `ux0:rePatch/PCSG00490/gamedata/data.psarc`; `eboot.bin` і `data0.psarc` з repatch лишаються.

(Точні шляхи й аргументи скриптів дивись у самих скриптах і `port/README.md`.)

## Наступні кроки (у порядку пріоритету)
1. **Тест у грі** (Vita3K з прошивкою або реальна Vita): чи рендериться кирилиця. Діалоги для перевірки: `c0301` «Хи-хи. Я чувствую запах своей добычи!», `c1600` «Хмпф. Вот и ещё один.». При падінні дивитись `vita3k.log`.
2. Якщо кирилиця не показується: дослідити кодування тексту й таблицю шрифтів (`ucs2jis.bin`, `jis2ucs.bin`, `vitafont2bit.fnt`, формат VFNT).
3. Конвертувати таблиці `text/t_*._dt` (предмети, імена, квести, книги): у них u16-таблиці зсувів + пул рядків, зсуви треба перерахувати після переходу на UTF-8. Додати у PSARC.
4. Підвищити покриття діалогів (3974 реплік лишилися англійськими): покращити зіставлення (`align.js`, проходи A/B/C), перевірити якість вибірково.
5. Фінальний пакет: `rePatch/PCSG00490/gamedata/data.psarc` (наш) + `data0.psarc` і `eboot.bin` з repatch.

## Формат msg/*.mbin (Vita)
u32 count; count×(u32 kind=1, u32 offset); зсуви відносно `4+8*count`. Запис = 3-байтова голова (`00 nn 01/00`) + `#коди` + текст, сегменти розділені `02 03`, кінець `02 00`.

## Примітки
- Python недоступний, увесь скриптинг на Node.js.
- У шляхах є `[NoNpDrm]`: у PowerShell використовувати `-LiteralPath`.
- Побічно: перезібраний `data.psarc` на ~61 МБ більший за оригінал (імовірно дедуплікація блоків; безпечно).
