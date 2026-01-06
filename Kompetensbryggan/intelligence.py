import pandas as pd

def analyze_profile_depth(detected_skills, cv_text):
    # Proaktiv analys: Hur avancerad är din kunskap?
    depth_scores = {}
    for skill in detected_skills:
        # Om kompetensen nämns nära ord som "Ansvarig", "Ledde" eller "Senior"
        # som i ditt fall med "Alumni Ambassador" eller "Ledde elevgrupp" [cite: 17, 82]
        if any(term in cv_text.lower() for term in ["ansvar", "ledde", "strategisk", "manager"]):
            depth_scores[skill['name']] = "Expert / Ledande"
        else:
            depth_scores[skill['name']] = "Operativ"
    return depth_scores

def get_education_roadmap(missing_skills, sun_data):
    # Kopplar gapet till utbildningsnivåer (SUN)
    recommendations = []
    for skill in list(missing_skills)[:5]:
        recommendations.append({
            "skill": skill,
            "level": "Kräver ofta eftergymnasial specialisering",
            "action": f"Sök kurser inom SUN-område för {skill}"
        })
    return recommendations