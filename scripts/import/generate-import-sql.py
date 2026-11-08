#!/usr/bin/env python3
"""Генерация SQL INSERT для app_data из public/data/ JSON."""

import json
import os
from datetime import datetime

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'public', 'data')

# Language pair ID mapping из БД (Liquibase)
LP_IDS = {
    'ru-en': 39, 'ru-zh': 40, 'ru-ja': 41, 'ru-ko': 42, 'ru-es': 43,
    'ru-perl': 44, 'ru-cplus': 45, 'ru-java': 46, 'ru-haskell': 47,
    'en-ru': 48, 'en-zh': 49, 'en-ja': 50, 'en-ko': 51, 'en-es': 52,
    'zh-ru': 53, 'zh-en': 54, 'zh-ja': 55, 'zh-ko': 56, 'zh-es': 57,
    'ja-ru': 58, 'ja-en': 59, 'ja-zh': 60, 'ja-ko': 61, 'ja-es': 62,
    'ko-ru': 63, 'ko-en': 64, 'ko-zh': 65, 'ko-ja': 66, 'ko-es': 67,
    'es-ru': 68, 'es-en': 69, 'es-zh': 70, 'es-ja': 71, 'es-ko': 72,
    'perl-ru': 73, 'cplus-ru': 74, 'java-ru': 75, 'haskell-ru': 76,
}

id_counter = 0
id_cache = {}

def s2id(s):
    global id_counter
    if s not in id_cache:
        id_counter += 1
        id_cache[s] = id_counter
    return id_cache[s]

def sb(n):
    return str(n) if n is not None else 'NULL'

def ss(s):
    if s is None: return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

CODE_MAP = {'cpp': 'cplus'}

def lp_id(known, learning):
    k = CODE_MAP.get(known, known)
    l = CODE_MAP.get(learning, learning)
    return LP_IDS.get(f'{k}-{l}')

def main():
    manifest = json.load(open(os.path.join(ROOT, 'content-manifest.json')))
    
    # === PRE-SCAN: assign IDs to ALL scenarios and lessons first ===
    print('-- Pre-scanning scenarios and lessons...')
    
    all_lessons = {}
    all_scenarios = {}
    
    for f in manifest.get('courseFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
            for l in (data.get('lessons') or []):
                all_lessons[l['id']] = l
        except Exception as e:
            print(f'--  Warning: {f}: {e}')
    
    for f in manifest.get('scenarioFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
            for s in (data.get('scenarios') or []):
                all_scenarios[s['id']] = s
        except Exception as e:
            print(f'--  Warning: {f}: {e}')
    
    for sid in sorted(all_scenarios.keys()):
        s2id(sid)
    
    for lid in sorted(all_lessons.keys()):
        s2id(lid)
    
    print(f'--  Scenarios: {len(all_scenarios)}, Lessons: {len(all_lessons)}')
    
    # === Build course structure ===
    course_map = {}
    for f in manifest.get('courseFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
            for c in (data.get('courses') or []):
                program_id_str = f'{c["id"]}-program'
                s2id(program_id_str)
                lessons = []
                for lid in (c.get('lessonIds') or []):
                    if lid in all_lessons:
                        lessons.append(lid)
                course_map[c['id']] = {
                    'program_id_str': program_id_str,
                    'lessons': lessons,
                    'languagePair': c.get('languagePair'),
                }
        except Exception as e:
            print(f'--  Warning: {f}: {e}')
    
    # === Output SQL ===
    print('-- LinguaCode: Data Import (app_data schema)')
    print(f'-- Generated: {datetime.utcnow().isoformat()}')
    print()
    
    print('-- ── 1. SYSTEM USER ──')
    print("""INSERT INTO app_data.users (id, display_name, email, password_hash, preferences, created_at, updated_at)
VALUES (1, 'System', 'system@linguacode.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
""")
    
    print('-- ── 2. CLEAR EXISTING DATA ──')
    print('TRUNCATE app_data.cards, app_data.scenarios, app_data.lessons, app_data.programs, app_data.courses RESTART IDENTITY CASCADE;')
    print()
    
    # 3. Courses
    print('-- ── 3. IMPORT COURSES ──')
    for f in manifest.get('courseFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
        except: continue
        for c in (data.get('courses') or []):
            cm = course_map[c['id']]
            cid = s2id(c['id'])
            pid = s2id(cm['program_id_str'])
            lpid = lp_id(c['languagePair']['known'], c['languagePair']['learning']) if c.get('languagePair') else None
            
            print(f'INSERT INTO app_data.courses (id, title, course_description, author_id, language_pair_id, published, created_at, updated_at)')
            print(f'VALUES ({cid}, {ss(c["title"])}, {ss(c.get("description", ""))}, 1, {sb(lpid)}, {c.get("published", True)}, NOW(), NOW());')
            
            print(f'INSERT INTO app_data.programs (id, title, course_id, author_id, published, program_description, created_at, updated_at)')
            print(f'VALUES ({pid}, {ss(c["title"] + " — Программа")}, {cid}, 1, true, {ss("Автоматически созданная программа")}, NOW(), NOW());')
            
            for lid in cm['lessons']:
                ld = all_lessons[lid]
                lid_int = s2id(lid)
                lpid2 = lp_id(c['languagePair']['known'], c['languagePair']['learning']) if c.get('languagePair') else None
                prereqs = ld.get('prerequisiteLessonIds', [])
                if isinstance(prereqs, str): prereqs = [prereqs]
                prereq_json = json.dumps([s2id(p) for p in prereqs])
                
                order_val = max(1, ld.get("order", 0))
                
                print(f'INSERT INTO app_data.lessons (id, program_id, title, lesson_description, prerequisite_lesson_ids, lesson_order, language_pair_id, course_id, created_at, updated_at)')
                print(f'VALUES ({lid_int}, {pid}, {ss(ld["title"])}, {ss(ld.get("description", ""))}, \'{prereq_json}\'::jsonb, {order_val}, {sb(lpid2)}, {cid}, NOW(), NOW());')
    print()
    
    # 4. Scenarios
    print('-- ── 4. IMPORT SCENARIOS ──')
    for f in manifest.get('scenarioFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
        except: continue
        for s in (data.get('scenarios') or []):
            sid = s2id(s['id'])
            cid = s2id(s['courseId']) if s.get('courseId') else None
            lpid = lp_id(s['languagePair']['known'], s['languagePair']['learning']) if s.get('languagePair') else None
            if cid and cid in course_map:
                pid = s2id(course_map[cid]['program_id_str'])
                lids = course_map[cid]['lessons']
                lid_val = s2id(lids[0]) if lids else None
            else:
                pid = None
                lid_val = None
            
            cs = json.dumps(s.get('cardSource', {'mode': 'fixed', 'cardIds': []}))
            
            print(f'INSERT INTO app_data.scenarios (id, title, scenario_description, author_id, card_source, published, language_pair_id, course_id, program_id, lesson_id, created_at, updated_at)')
            print(f'VALUES ({sid}, {ss(s["title"])}, {ss(s.get("description", ""))}, 1, \'{cs.replace(chr(39), chr(39)+chr(39))}\'::jsonb, {s.get("published", True)}, {sb(lpid)}, {sb(cid)}, {sb(pid)}, {sb(lid_val)}, NOW(), NOW());')
    print()
    
    # 5. Cards
    print('-- ── 5. IMPORT CARDS ──')
    for f in manifest.get('cardFiles', []):
        fp = os.path.join(ROOT, f.lstrip('/'))
        try:
            data = json.load(open(fp))
        except: continue
        for card in (data.get('cards') or []):
            cid = s2id(card['id'])
            kind = card['kind'].upper().replace('-', '_')
            
            data_obj = {k: v for k, v in card.items() if k not in ('id', 'kind', 'title', 'meta', 'courseId', 'lessonId', 'scenarioId')}
            dj = json.dumps(data_obj)
            
            tags = card.get('meta', {}).get('tags', [])
            tj = json.dumps(tags)
            
            diff = None
            meta = card.get('meta') or {}
            if isinstance(meta, dict) and meta.get('difficulty'):
                dval = meta['difficulty']
                if isinstance(dval, str):
                    dm = {'beginner': 'BEGINNER', 'intermediate': 'INTERMEDIATE', 'advanced': 'ADVANCED'}
                    diff = dm.get(dval)
            
            # relations
            lid = s2id(card['lessonId']) if card.get('lessonId') and card['lessonId'] in all_lessons else None
            scenid = s2id(card['scenarioId']) if card.get('scenarioId') and card['scenarioId'] in all_scenarios else None
            program_id = course_id = lpid = None
            if card.get('courseId') and card['courseId'] in course_map:
                cm = course_map[card['courseId']]
                program_id = s2id(cm['program_id_str'])
                course_id = s2id(card['courseId'])
                if cm.get('languagePair'):
                    lpid = lp_id(cm['languagePair']['known'], cm['languagePair']['learning'])
            
            print(f'INSERT INTO app_data.cards (id, kind, title, data_json, tags, difficulty, language_pair_id, course_id, program_id, lesson_id, scenario_id, created_at, updated_at)')
            print(f'VALUES ({cid}, {ss(kind)}, {ss(card["title"])}, \'{dj.replace(chr(39), chr(39)+chr(39))}\'::jsonb, \'{tj.replace(chr(39), chr(39)+chr(39))}\'::jsonb, {ss(diff)}, {sb(lpid)}, {sb(course_id)}, {sb(program_id)}, {sb(lid)}, {sb(scenid)}, NOW(), NOW());')
    print()
    
    print('-- Import complete')
    print(f'-- Total IDs assigned: {id_counter}')

if __name__ == '__main__':
    main()
