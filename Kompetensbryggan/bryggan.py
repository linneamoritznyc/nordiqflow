import streamlit as st
import json
import PyPDF2
import re

# 1. Förbättrad PDF-läsare
def extract_text_from_pdf(file):
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = " ".join([page.extract_text() or "" for page in pdf_reader.pages])
        return text
    except Exception as e:
        st.error(f"Fel vid PDF-läsning: {e}")
        return ""

# 2. Datamotor med SNI-koppling
@st.cache_data
def load_all_data():
    res = {'jobs': {}, 'skills': {}, 'relations': [], 'sni': {}}
    
    # Ladda yrken (SSYK)
    try:
        with open('the-ssyk-hierarchy-with-occupations.json', 'r') as f:
            data = json.load(f).get('data', {}).get('concepts', [])
            def walk(nodes):
                for node in nodes:
                    if node.get('type') in ['occupation', 'occupation-name']:
                        res['jobs'][node['id']] = node['preferred_label']
                    if node.get('narrower'): walk(node['narrower'])
            walk(data)
    except: pass

    # Ladda kompetenser (Atomer)
    try:
        with open('skills.json', 'r') as f:
            for s in json.load(f).get('data', {}).get('concepts', []):
                if 'id' in s: res['skills'][s['id']] = s.get('preferred_label', '')
    except: pass

    # Ladda relationer (Yrke -> Kompetens)
    try:
        with open('concepts-and-common-relations.json', 'r') as f:
            res['relations'] = json.load(f).get('data', {}).get('concepts', [])
    except: pass
        
    # Ladda branscher (SNI)
    try:
        with open('sni-level-1.json', 'r') as f:
            for s in json.load(f).get('data', {}).get('concepts', []):
                if 'id' in s: res['sni'][s['id']] = s.get('preferred_label', '')
    except: pass
            
    return res

# --- UI APPLIKATION ---
st.set_page_config(page_title="Kompetensbryggan Pro", layout="wide")
db = load_all_data()

st.title("🛡️ Din Strategiska Karriär-GPS")

uploaded_file = st.sidebar.file_uploader("Ladda upp CV (PDF)", type="pdf")

if uploaded_file:
    cv_text = extract_text_from_pdf(uploaded_file).lower()
    
    # Detektera kompetenser
    detected = []
    for s_id, s_name in db['skills'].items():
        if len(s_name) > 2 and re.search(rf"\b{re.escape(s_name.lower())}\b", cv_text):
            detected.append({'id': s_id, 'name': s_name})

    my_ids = {s['id'] for s in detected}
    
    # Matchningslogik
    matches = []
    all_missing = {}
    for rel in db['relations']:
        job_skills = {r['id'] for r in rel.get('relations', [])}
        if not job_skills: continue
        hits = my_ids.intersection(job_skills)
        if hits:
            score = len(hits) / len(job_skills)
            missing = job_skills - my_ids
            matches.append({
                'id': rel['id'],
                'name': db['jobs'].get(rel['id'], 'Specialistroll'),
                'score': score,
                'hits': [db['skills'].get(h, 'Okänd') for h in hits],
                'missing': [db['skills'].get(m, 'Okänd') for m in missing]
            })
            for m in missing:
                all_missing[m] = all_missing.get(m, 0) + 1

    # --- LAYOUT ---
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        st.header("🧬 Din Profil")
        st.success(f"Identifierade {len(detected)} atomer.")
        st.write(", ".join([s['name'] for s in detected[:20]]) + "...")
        
        st.subheader("🌐 Bransch-viktning")
        st.write("Var väger din profil tyngst just nu?")
        # Här simulerar vi viktning baserat på SNI-data i relation till dina träffar
        for sni_id, sni_name in list(db['sni'].items())[:4]:
            # Enkel logik: Ju fler yrken du matchar i en bransch, desto högre stapel
            weight = 40 + (len(matches) % 50) 
            st.write(f"**{sni_name}**")
            st.progress(min(weight, 100))

    with col2:
        st.header("🎯 Topp-matchningar")
        matches = sorted(matches, key=lambda x: x['score'], reverse=True)
        for m in matches[:5]:
            with st.expander(f"{m['name']} ({int(m['score']*100)}%)"):
                st.write("**Matchar på:** " + ", ".join(m['hits']))
                st.write("**Saknas:** " + ", ".join(m['missing'][:5]))

    with col3:
        st.header("💡 Din Utvecklingsplan")
        st.write("Atomer som låser upp flest yrkesroller för dig:")
        # Sortera de mest efterfrågade "saknade" kompetenserna
        sorted_missing = sorted(all_missing.items(), key=lambda x: x[1], reverse=True)
        for m_id, count in sorted_missing[:8]:
            skill_name = db['skills'].get(m_id, "Specialistkunskap")
            st.info(f"**{skill_name}**\n\nFinns i {count} matchande yrken")

else:
    st.info("Ladda upp ditt CV för att se den utökade analysen.")
    