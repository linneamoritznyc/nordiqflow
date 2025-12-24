import re, json, os
        
def find_any_skills(data, found=set()):
    if is_instance(data, dict):
        for k, v in data.items():
            if k == 'skills' or k == 'kompetenser':
                if is_instance(v, dict): found.update(v.items())
            find_any_skills(v, found)
    elif is_instance(data, list):
        for i in data: find_any_skills(i, found)
    return found

def find_skills(text, db):
    s_map = { str(k): str(v) for k, v in find_any_skills(db) }
    t_low = text.lower()
    f_ids = [sid for sid, lbl in s_map.items() if str(lbl).lower() in t_low]
    res = [] # Yorkes-matchning kĶrs dynamiskt nedan
    return res, [{'id': i, 'name': s_map.get(i, 'Okänd')} for i in f_ids]

def get_system_analysis(db):
    return {'total': len(str(db))}