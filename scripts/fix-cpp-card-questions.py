#!/usr/bin/env python3
"""
fix-cpp-card-questions.py — замена плохих (шаблонных) вопросов на качественные.

Сценарий-менеджер курса C++ Complete Course (см. .continue/prompts/data/cpp.prompt.md).

Что делает:
  * Для каждой карточки-файла в public/data/cpp/cards/ определяет, содержит ли
    файл «плохие» вопросы (шаблонные дистракторы / повтор вопроса в опциях).
  * Если файл помечен как плохой — заменяет содержимое его карточек на
    качественные вопросы из банка (scripts/cpp-question-banks/*.json),
    соответствующие теме урока и сценария.
  * Правила сохранения структуры:
      - id, appearance, direction, meta.knownLanguage, meta.learningLanguage,
        courseId, lessonId, scenarioId — НЕ меняются (карточки не удаляются);
      - заменяются: kind, title, prompt/question/code, options, correctIndex,
        meta.difficulty, meta.tags, explanation.
  * Проверяет уникальность id в файле.

Использование:
  python3 scripts/fix-cpp-card-questions.py --apply   # применить банки
  python3 scripts/fix-cpp-card-questions.py --check   # только проверка
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_DIR = os.path.join(ROOT, "public", "data", "cpp", "cards")
BANKS_DIR = os.path.join(ROOT, "scripts", "cpp-question-banks")

BAD_MARKERS = (
    "Только для embedded систем",
    "Устаревшая технология",
    "Не имеет отношения к C++",
    "Применяется только в теории",
)

# Поля, которые нельзя трогать (структура / привязка).
IMMUTABLE_KEYS = (
    "id", "appearance", "direction",
    "meta", "courseId", "lessonId", "scenarioId",
)
META_IMMUTABLE = ("knownLanguage", "learningLanguage")


def is_bad_card(card: dict) -> bool:
    """Карточка считается плохой, если опции шаблонные или повторяют вопрос."""
    opts = card.get("optionsLearning") or card.get("outputOptions") or []
    prompt = card.get("promptKnown") or card.get("question") or ""
    if not opts:
        return False
    if opts[0].strip() == prompt.strip():
        return True
    return any(any(m in o for m in BAD_MARKERS) for o in opts)


def _expand_item(item) -> dict:
    """Компактный формат банка -> полная карточка.

    select формат:
      ["select", title, prompt, options, correctIndex, difficulty, tags, explanation?]
    code-trace формат:
      ["code-trace", title, question, code, outputOptions, correctIndex, difficulty, tags, explanation?]
    code-select формат:
      ["code-select", title, promptCode, options, correctIndex, difficulty, tags, explanation?]
    item может быть и готовым dict — тогда возвращается как есть.
    """
    if isinstance(item, dict):
        return item
    if not isinstance(item, (list, tuple)):
        raise ValueError(f"Неизвестный формат банка: {item!r}")
    kind = item[0]
    if kind == "select":
        _, title, prompt, options, corr, diff, tags = item[:7]
        out = {
            "kind": "select", "title": title, "promptKnown": prompt,
            "optionsLearning": options, "correctIndex": corr,
            "difficulty": diff, "tags": tags,
        }
    elif kind == "code-trace":
        _, title, question, code, options, corr, diff, tags = item[:8]
        out = {
            "kind": "code-trace", "title": title, "question": question,
            "code": {"code": code, "language": "cpp"},
            "outputOptions": options, "correctIndex": corr,
            "difficulty": diff, "tags": tags,
        }
    elif kind == "code-select":
        _, title, code, options, corr, diff, tags = item[:7]
        out = {
            "kind": "code-select", "title": title,
            "prompt": {"code": code, "language": "cpp"},
            "options": options, "correctIndex": corr,
            "difficulty": diff, "tags": tags,
        }
    else:
        raise ValueError(f"Неизвестный kind банка: {kind}")
    if len(item) > (8 if kind == "code-trace" else 7) and item[-1]:
        out["explanation"] = item[-1]
    return out


def load_banks() -> dict[str, list[dict]]:
    """Загружает все банки: scenarioId -> список из 20 карточек.

    Поддерживается секция "aliases": {"target.scenario": "source.scenario"},
    где target получает тот же список карточек, что и source.
    Псевдонимы разрешаются в два этапа, чтобы source мог находиться
    в другом файле (используется для сценариев-дубликатов одной темы).
    """
    raw_banks: dict[str, list] = {}
    aliases: dict[str, str] = {}
    for path in sorted(glob.glob(os.path.join(BANKS_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for sc_id, cards in data.get("banks", {}).items():
            if isinstance(cards, list):
                raw_banks[sc_id] = cards
        for alias, source in data.get("aliases", {}).items():
            aliases[alias] = source

    banks: dict[str, list[dict]] = {}
    for sc_id, cards in raw_banks.items():
        banks[sc_id] = [_expand_item(it) for it in cards]
    # Второй проход: разрешаем псевдонимы (и цепочки псевдонимов).
    resolved: set[str] = set()
    for alias, source in aliases.items():
        target = source
        seen = 0
        while target in aliases and target not in raw_banks and seen < 100:
            target = aliases[target]
            seen += 1
        if target in banks:
            banks[alias] = banks[target]
    return banks


def apply_bank(card: dict, bank: dict) -> dict:
    """Заменяет контент карточки содержимым банка, сохраняя структуру."""
    meta = card.get("meta", {})
    new_meta = {
        "knownLanguage": meta.get("knownLanguage", "ru"),
        "learningLanguage": meta.get("learningLanguage", "cpp"),
        "difficulty": bank.get("difficulty", "beginner"),
        "tags": bank.get("tags", []),
    }
    result = {
        "id": card["id"],
        "kind": bank.get("kind", "select"),
        "title": bank.get("title", card.get("title", "")),
        "appearance": card.get("appearance", {"theme": "azure-blue", "fontSize": "md"}),
        "direction": card.get("direction", "known-to-learning"),
        "meta": new_meta,
        "courseId": card.get("courseId", "course-cpp-complete"),
        "lessonId": card.get("lessonId"),
        "scenarioId": card.get("scenarioId"),
    }
    kind = result["kind"]
    if kind == "code-trace":
        result["question"] = bank.get("question", bank.get("promptKnown", ""))
        result["code"] = bank.get("code", {"code": "", "language": "cpp"})
        result["outputOptions"] = bank.get("outputOptions", bank.get("optionsLearning", []))
    elif kind == "code-select":
        result["prompt"] = bank.get("prompt", {"code": "", "language": "cpp"})
        result["options"] = bank.get("options", [])
    else:  # select
        result["promptKnown"] = bank.get("promptKnown", "")
        result["optionsLearning"] = bank.get("optionsLearning", [])
    result["correctIndex"] = bank.get("correctIndex", 0)
    if bank.get("explanation"):
        result["explanation"] = bank["explanation"]
    return result


def sort_key(fn: str) -> tuple:
    name = os.path.basename(fn)
    prefix = "zzz" if ".performance." in name else name
    return (prefix, name)


def check_ids(filepath: str, cards: list[dict]) -> list[str]:
    ids = [c.get("id") for c in cards]
    seen = set()
    dupes = []
    for i in ids:
        if i in seen:
            dupes.append(i)
        seen.add(i)
    return dupes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="применить банки к плохим файлам")
    parser.add_argument("--check", action="store_true", help="только отчёт (без записи)")
    args = parser.parse_args()

    banks = load_banks()
    files = sorted(glob.glob(os.path.join(CARDS_DIR, "*.cards.json")), key=sort_key)

    bad_files = []
    fixed = 0
    missing = []
    skipped_clean = 0

    for path in files:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        cards = data.get("cards", [])
        scenario_id = data.get("scenarioId") or (cards[0].get("scenarioId") if cards else "")
        is_bad = any(is_bad_card(c) for c in cards)
        if not is_bad:
            skipped_clean += 1
            continue
        bad_files.append(path)
        if scenario_id not in banks:
            missing.append(scenario_id)
            continue
        bank_list = banks[scenario_id]
        if len(bank_list) < len(cards):
            print(f"  WARN: банк {scenario_id} ({len(bank_list)}) < карточек ({len(cards)})")
        new_cards = []
        for i, card in enumerate(cards):
            bank = bank_list[i] if i < len(bank_list) else bank_list[-1]
            new_cards.append(apply_bank(card, bank))
        dupes = check_ids(path, new_cards)
        if dupes:
            print(f"  ERROR: дубли id в {os.path.basename(path)}: {dupes}")
            return 1
        if not args.check:
            data["cards"] = new_cards
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
        fixed += len(new_cards)

    print(f"Файлов проверено: {len(files)}")
    print(f"Чистых (не трогали): {skipped_clean}")
    print(f"Плохих файлов: {len(bad_files)}")
    print(f"Заменено карточек: {fixed}")
    if missing:
        print(f"Нет банка для {len(missing)} сценариев:")
        for m in missing:
            print("   ", m)
        return 2
    if fixed == 0 and bad_files:
        print("ERROR: плохие файлы есть, но банки не применены")
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())