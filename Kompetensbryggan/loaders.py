import json
import PyPDF2
import os

def load_jobtech_data():
    """
    Data Engineering Core:
    Implementerar hierarkisk mappning (Skill-to-Parent) för att överbrygga 
    granularitetsgapet mellan CV-atomer och yrkeskrav.
    """
    db = {
        'jobs': {}, 
        'skills': {}, 
        'relations': [], 
        'hierarchy': {}  # Nytt: mappar barn-ID -> [föräldra-IDn]
    }
    
    current_folder = os.path.dirname(os.path.abspath(__file__))
    master_file = os.path.join(current_folder, 'concepts-and-common-relations.json')
    skills_file = os.path.join(current_folder, 'skills.json')

    try:
        # 1. Ladda kompetenser OCH deras hierarkiska kopplingar
        if os.path.exists(skills_file):
            with open(skills_file, 'r', encoding='utf-8') as f:
                content = json.load(f)
                concepts = content.get('data', {}).get('concepts', [])
                for s in concepts:
                    s_id = str(s['id'])
                    db['skills'][s_id] = s['preferred_label']
                    
                    # Extrahera "föräldrar" (broader) för att förstå kontext
                    # Om 'Google Ads' har 'Marknadsföring' som broader, sparar vi det här.
                    parents = [str(b['id']) for b in s.get('broader', []) if 'id' in b]
                    if parents:
                        db['hierarchy'][s_id] = parents
            print(f"✅ Pipeline: {len(db['skills'])} atomer och {len(db['hierarchy'])} hierarkiska kopplingar laddade.")

        # 2. Ladda yrken och deras kravprofiler
        if os.path.exists(master_file):
            with open(master_file, 'r', encoding='utf-8') as f:
                content = json.load(f)
                all_concepts = content.get('data', {}).get('concepts', [])
                
                for c in all_concepts:
                    if c.get('type') == 'occupation-name':
                        c_id = str(c.get('id'))
                        db['jobs'][c_id] = c.get('preferred_label')
                        
                        # Vi samlar relationer från ALLA relevanta fält för maximal täckning
                        raw_relations = (
                            c.get('related', []) + 
                            c.get('broader', []) + 
                            c.get('close_match', []) + 
                            c.get('exact_match', [])
                        )
                        
                        clean_rels = [str(r['id']) for r in raw_relations if 'id' in r]
                        
                        if clean_rels:
                            db['relations'].append({
                                'id': c_id,
                                'relations': [{'id': rid} for rid in set(clean_rels)] # set() tar bort dubbletter
                            })
                
                print(f"✅ Pipeline: {len(db['jobs'])} yrken mappade mot relationsmatrisen.")
        else:
            print(f"❌ Fel: Hittade inte master-filen {master_file}")
                
    except Exception as e:
        print(f"❌ Kritisk pipeline-krasch: {e}")
        
    return db

def extract_text(pdf_file):
    """Extraherar råtext från PDF."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = " ".join([page.extract_text() or "" for page in reader.pages])
        return text
    except Exception as e:
        return f"Extraction Error: {e}"