#!/usr/bin/env python3
"""Restructure radicals course: 21 scenarios (10 cards each, last=14), 3 lessons (7 scenarios each)."""

import json
from datetime import datetime

NOW = "2026-06-14T12:00:00.000Z"

# --- Load source data ---
with open("public/data/cards/radicals-course-cards.json", "r", encoding="utf-8") as f:
    cards_data = json.load(f)

with open("public/data/courses/radicals-214-course.json", "r", encoding="utf-8") as f:
    course_data = json.load(f)

cards = cards_data["cards"]
assert len(cards) == 214, f"Expected 214 cards, got {len(cards)}"

# --- Define new structure ---
# 21 scenarios: 20 × 10 cards + 1 × 14 cards
# 3 lessons: 7 + 7 + 7 scenarios

# Build mapping: card_index → (lessonId, scenarioId)
lesson_ids = [f"lesson-radicals-{i:02d}" for i in range(1, 4)]  # 01, 02, 03
scenario_ids = [f"scenario-radicals-{i:02d}" for i in range(1, 22)]  # 01..21

# Lesson → scenarios mapping
lesson_scenarios = {
    "lesson-radicals-01": scenario_ids[0:7],   # scenarios 01-07
    "lesson-radicals-02": scenario_ids[7:14],  # scenarios 08-14
    "lesson-radicals-03": scenario_ids[14:21], # scenarios 15-21
}

# Scenario → cards mapping
scenario_cards = {}
for s_idx, s_id in enumerate(scenario_ids):
    start = s_idx * 10
    end = start + 10 if s_idx < 20 else 214  # last scenario: 14 cards
    scenario_cards[s_id] = cards[start:end]

# --- Update cards ---
updated_cards = []
for card in cards:
    card = dict(card)  # shallow copy
    # Determine card index (1-based)
    card_id = card["id"]  # draw-radical-XXX
    card_num = int(card_id.split("-")[-1])  # 1..214
    card_idx = card_num - 1  # 0-based

    # Determine scenario and lesson
    scenario_idx = card_idx // 10
    if scenario_idx > 20:
        scenario_idx = 20  # last scenario has 14 cards (indices 200-213)
    scenario_id = scenario_ids[scenario_idx]
    # Determine lesson from scenario
    for lid, sids in lesson_scenarios.items():
        if scenario_id in sids:
            lesson_id = lid
            break

    card["lessonId"] = lesson_id
    card["scenarioId"] = scenario_id
    updated_cards.append(card)

# --- Write updated cards file ---
cards_output = {"cards": updated_cards}
with open("public/data/cards/radicals-course-cards.json", "w", encoding="utf-8") as f:
    json.dump(cards_output, f, ensure_ascii=False, indent=2)
print(f"✓ Updated radicals-course-cards.json: {len(updated_cards)} cards")

# --- Build scenarios file ---
scenarios_output = {"scenarios": []}
for s_idx, s_id in enumerate(scenario_ids):
    card_list = scenario_cards[s_id]
    card_count = len(card_list)
    first_rad = s_idx * 10 + 1
    last_rad = first_rad + card_count - 1
    title = f"Радикалы {first_rad}–{last_rad}"
    desc = f"{card_count} карточек: радикалы Канси №{first_rad}–{last_rad}. Прописывание черт и порядок написания."

    card_ids = [c["id"] for c in card_list]

    # Determine lesson
    lesson_id = None
    for lid, sids in lesson_scenarios.items():
        if s_id in sids:
            lesson_id = lid
            break

    scenario = {
        "id": s_id,
        "title": title,
        "description": desc,
        "authorId": "system",
        "published": True,
        "updatedAt": NOW,
        "languagePair": {
            "known": "ru",
            "learning": "zh"
        },
        "courseId": "course-zh-radicals-214",
        "lessonId": lesson_id,
        "cardSource": {
            "mode": "fixed",
            "cardIds": card_ids
        }
    }
    scenarios_output["scenarios"].append(scenario)

with open("public/data/scenarios/radicals-scenarios.json", "w", encoding="utf-8") as f:
    json.dump(scenarios_output, f, ensure_ascii=False, indent=2)
print(f"✓ Updated radicals-scenarios.json: {len(scenarios_output['scenarios'])} scenarios")

# --- Build course file ---
# Update course description
course_entry = course_data["courses"][0]
course_entry["description"] = "Полный курс по 214 классическим ключам (康熙部首): 21 сценарий по 10 карточек (последний — 14), 3 урока по 7 сценариев, прописывание формы и порядка черт каждого радикала."
course_entry["lessonIds"] = lesson_ids
course_entry["updatedAt"] = NOW

# Build lessons array
lessons_output = []
for l_idx, lid in enumerate(lesson_ids):
    sids = lesson_scenarios[lid]
    first_s = int(sids[0].split("-")[-1])
    last_s = int(sids[-1].split("-")[-1])
    prev_lid = lesson_ids[l_idx - 1] if l_idx > 0 else []

    lesson = {
        "id": lid,
        "courseId": "course-zh-radicals-214",
        "title": f"Урок {l_idx + 1}: сценарии {first_s}–{last_s}",
        "description": f"7 сценариев: {sids[0]} — {sids[-1]}.",
        "scenarioIds": sids,
        "prerequisiteLessonIds": prev_lid,
        "order": l_idx,
        "updatedAt": NOW
    }
    lessons_output.append(lesson)

course_data["lessons"] = lessons_output

with open("public/data/courses/radicals-214-course.json", "w", encoding="utf-8") as f:
    json.dump(course_data, f, ensure_ascii=False, indent=2)
print(f"✓ Updated radicals-214-course.json: {len(lessons_output)} lessons")

# --- Validation ---
# Check every card is assigned exactly once
assigned_cards = set()
for card in updated_cards:
    assigned_cards.add(card["id"])
assert len(assigned_cards) == 214, f"Duplicate/missing cards: expected 214, got {len(assigned_cards)}"

# Check scenario card counts
for s_id, card_list in scenario_cards.items():
    assert len(card_list) == 10 or (s_id == "scenario-radicals-21" and len(card_list) == 14), \
        f"{s_id}: expected 10 (or 14 for last), got {len(card_list)}"

# Check lesson scenario counts
for lid, sids in lesson_scenarios.items():
    assert len(sids) == 7, f"{lid}: expected 7 scenarios, got {len(sids)}"

print("✓ Validation passed: 214 cards, 21 scenarios (20×10 + 1×14), 3 lessons (7 scenarios each)")
