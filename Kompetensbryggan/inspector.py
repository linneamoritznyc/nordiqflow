import json
import os

def inspect_json_files():
    # Lista på de filer vi vill analysera
    files_to_inspect = ['jobs.json', 'skills.json', 'relations.json']
    output_file = 'filestructures.txt'
    
    analysis = "=== DATASYSTEMETS STRUKTUR-ANALYS ===\n\n"
    
    for filename in files_to_inspect:
        analysis += f"--- FIL: {filename} ---\n"
        
        if not os.path.exists(filename):
            analysis += "Status: HITTADES EJ!\n\n"
            continue
            
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Om det är en lista, kolla första objektet
                if isinstance(data, list):
                    analysis += f"Typ: Lista med {len(data)} objekt.\n"
                    if len(data) > 0:
                        analysis += "Exempel-objekt (Struktur):\n"
                        first_item = data[0]
                        for key, value in first_item.items():
                            analysis += f"  - {key}: {type(value).__name__} (Exempel: {value})\n"
                            
                            # Om det finns nästlade relationer, inspektera dem
                            if key == 'relations' and isinstance(value, list) and len(value) > 0:
                                analysis += "    * Understruktur i 'relations':\n"
                                for sub_key, sub_val in value[0].items():
                                    analysis += f"      - {sub_key}: {type(sub_val).__name__} (Exempel: {sub_val})\n"

                # Om det är ett objekt (dictionary)
                elif isinstance(data, dict):
                    analysis += f"Typ: Dictionary med {len(data)} nycklar.\n"
                    first_key = list(data.keys())[0]
                    analysis += f"Exempel-nyckel: {first_key} ({type(first_key).__name__})\n"
                    analysis += f"Exempel-värde: {data[first_key]} ({type(data[first_key]).__name__})\n"
                
                analysis += "\n"
                
        except Exception as e:
            analysis += f"Fel vid läsning: {str(e)}\n\n"

    # Skriv ner analysen till fil
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(analysis)
    
    print(f"✅ Analys slutförd! Öppna filen '{output_file}' för att se resultatet.")

if __name__ == "__main__":
    inspect_json_files()