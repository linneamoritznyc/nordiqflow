import plotly.express as px
import pandas as pd
import streamlit as st

def draw_taxonomy_tree(matches):
    """Ritar upp det hierarkiska trädet: Bransch -> Yrke."""
    if not matches:
        st.warning("Ingen matchningsdata tillgänglig för trädet.")
        return
    
    data = []
    for m in matches[:50]:
        name = m['name'].lower()
        # Avancerad kategorisering baserad på yrkestitlar
        if any(x in name for x in ["marknad", "ads", "seo", "kommunikation", "pr"]): 
            segment = "Media & Marknad"
        elif any(x in name for x in ["it", "system", "data", "utvecklare", "mjukvara", "programmerare"]): 
            segment = "IT & Tech"
        elif any(x in name for x in ["chef", "ledare", "manager", "koordinator", "projektledare"]): 
            segment = "Ledning & Strategi"
        elif any(x in name for x in ["konst", "grafisk", "design", "kultur", "museum"]): 
            segment = "Kultur & Kreativt"
        elif any(x in name for x in ["logistik", "transport", "lager", "spedition"]): 
            segment = "Logistik & Transport"
        else:
            segment = "Övriga Sektorer"
        
        data.append({
            "Segment": segment,
            "Yrkesroll": m['name'],
            "Matchning": m['score'] * 100
        })
    
    df = pd.DataFrame(data)
    fig = px.sunburst(
        df, 
        path=['Segment', 'Yrkesroll'], 
        values='Matchning',
        color='Matchning',
        color_continuous_scale='GnBu',
        title="Ditt Yrkes-ekosystem (Taxonomisk vy)"
    )
    fig.update_layout(margin=dict(t=40, l=0, r=0, b=0))
    st.plotly_chart(fig, use_container_width=True)

def draw_industry_heatmap(all_matches):
    """Visar potential i SNI-branscher."""
    industry_hits = {
        "IT & Kommunikation": 0,
        "Kultur & Fritid": 0,
        "Handel & Transport": 0,
        "Företagstjänster": 0,
        "Utbildning": 0
    }
    
    for m in all_matches:
        name = m['name'].lower()
        if any(x in name for x in ["it", "data", "ads"]): industry_hits["IT & Kommunikation"] += 1
        if any(x in name for x in ["konst", "kultur"]): industry_hits["Kultur & Fritid"] += 1
        if any(x in name for x in ["logistik", "handel"]): industry_hits["Handel & Transport"] += 1
        if any(x in name for x in ["ambassadör", "lärare"]): industry_hits["Utbildning"] += 1
        if any(x in name for x in ["koordinator", "administratör"]): industry_hits["Företagstjänster"] += 1

    df = pd.DataFrame([{"Bransch": k, "Vikt": v} for k, v in industry_hits.items()])
    fig = px.treemap(df, path=['Bransch'], values='Vikt', color='Vikt', color_continuous_scale='Purples')
    st.write("### 🏢 Branschpotential (SNI)")
    st.plotly_chart(fig, use_container_width=True)

def draw_skill_cluster(detected):
    """Visar alla identifierade atomer i ett kluster."""
    if not detected: return
    df = pd.DataFrame(detected)
    df['count'] = 1
    fig = px.treemap(df, path=['name'], values='count', title="Identifierade Kompetens-atomer")
    st.plotly_chart(fig, use_container_width=True)