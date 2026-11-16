"""
Lectura de las etimologías del Wikcionario: convierte la plantilla {{etimología|...}}
en una frase legible y clasifica la palabra en un «grupo de origen» para el modo
«Origen» del mapa. Lo usa scripts/procesar.py.
"""
import re

LENGUAS = {
    "la": "latín", "la-vul": "latín vulgar", "la-lat": "latín tardío", "grc": "griego antiguo",
    "osp": "español antiguo", "es": "español", "ast": "asturiano", "mxi": "mozárabe",
    "xaa": "árabe hispánico", "ar": "árabe", "rmq": "caló",
    "qu": "quechua", "nah": "náhuatl", "nci": "náhuatl clásico", "gn": "guaraní", "gug": "guaraní",
    "arn": "mapudungun", "tnq": "taíno", "ay": "aimara", "myn": "maya", "yua": "maya yucateco",
    "pua": "purépecha", "cab": "garífuna", "car": "caribe", "gnc": "guanche",
    "en": "inglés", "fr": "francés", "fro": "francés antiguo", "pt": "portugués", "it": "italiano",
    "lij": "genovés", "nap": "napolitano", "roa-oit": "italiano antiguo", "de": "alemán",
    "hu": "húngaro", "ml": "malayalam", "hi": "hindi",
    "tr": "turco", "ota": "turco otomano", "akk": "acadio", "ca": "catalán",
    "wo": "wolof", "kg": "kikongo", "yo": "yoruba", "kmb": "kimbundu",
}

GRUPOS = {
    "indigena": {"qu", "nah", "nci", "gn", "gug", "arn", "tnq", "ay", "myn", "yua", "pua", "cab", "car"},
    "italiano": {"it", "lij", "nap", "roa-oit"},
    "ingles": {"en"},
    "africano": {"wo", "kg", "yo", "kmb"},
    "europeo": {"fr", "fro", "pt", "de", "hu"},
    "herencia": {"la", "la-vul", "la-lat", "grc", "osp", "es", "ast", "mxi", "xaa", "ar", "rmq", "gnc"},
}
# Tipos de formación interna del español
FORMACION = {"endo", "sufijo", "prefijo", "confijo", "acort", "acortamiento", "ACORT", "dimi", "diminutivo",
             "aumentativo", "deverbal", "compuesto", "aféresis", "apócope", "epéntesis", "femenino",
             "masculino", "plural", "pronominal", "part", "fone", "fonética", "epónimo", "EPON", "marca"}
INCIERTO = {"incierta", "onomatopeya", "ONOM", "(CÓDIGO DE IDIOMA)", ""}


def _args(cuerpo):
    pos, nom = [], {}
    for a in cuerpo.split("|"):
        a = a.strip()
        if "=" in a:
            k, v = a.split("=", 1)
            nom[k.strip()] = v.strip()
        elif a:
            pos.append(a)
    return pos, nom


def _de(codigo):
    n = LENGUAS.get(codigo, codigo)
    return f"del {n}"


def _frase(pos, nom):
    """{{etimología|...}} -> frase en español."""
    if not pos:
        return ""
    c, resto = pos[0], pos[1:]
    glosa = nom.get("glosa") or (resto[1] if len(resto) > 1 and c in LENGUAS else "")
    if c in ("incierta",):
        return "De origen incierto"
    if c in ("onomatopeya", "ONOM"):
        return "Voz onomatopéyica"
    if c in ("acort", "acortamiento", "ACORT", "aféresis", "apócope") and resto:
        return f"Acortamiento de «{resto[0]}»"
    if c in ("dimi", "diminutivo") and resto:
        return f"Diminutivo de «{resto[0]}»"
    if c == "aumentativo" and resto:
        return f"Aumentativo de «{resto[0]}»"
    if c == "sufijo" and len(resto) >= 2:
        return f"De «{resto[0]}» y el sufijo «-{resto[1].lstrip('-')}»"
    if c == "prefijo" and len(resto) >= 2:
        return f"Del prefijo «{resto[0].rstrip('-')}-» y «{resto[1]}»"
    if c == "compuesto" and len(resto) >= 2:
        return f"Compuesto de «{resto[0]}» y «{resto[1]}»"
    if c in ("endo", "deverbal", "pronominal", "femenino", "masculino", "plural", "part") and resto:
        return f"De «{resto[0]}»"
    if c in LENGUAS and resto:
        return f"{_de(c).capitalize()} {resto[0]}" + (f" («{glosa}»)" if glosa else "")
    if c in LENGUAS:
        return _de(c).capitalize()
    return ""


def _limpiar(s):
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\[\[(?:Archivo|File|Imagen):[^\]]*\]\]", "", s)

    def etim(m):
        pos, _ = _args(m.group(1))
        if not pos:
            return ""
        return f"{_de(pos[0])} {pos[1]}" + (f" («{pos[2]}»)" if len(pos) > 2 else "") if len(pos) > 1 else _de(pos[0])
    s = re.sub(r"\{\{etim\|([^{}]*)\}\}", etim, s)
    s = re.sub(r"\{\{(?:l|plm|l\+|ucf)\|(?:[a-z-]+\|)?([^{}|]*)[^{}]*\}\}", r"\1", s)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", s)
    s = s.replace("'''", "").replace("''", "")
    return " ".join(s.split())


def leer(linea):
    """Línea que empieza con {{etimología...}} -> {texto, codigo, grupo, etimo} o None."""
    m = re.match(r"\{\{etimología\|?([^{}]*)\}\}(.*)", linea.strip())
    if not m:
        return None
    pos, nom = _args(m.group(1))
    if "leng" in nom:  # etimología de otra lengua: no interesa
        return None
    codigo = pos[0] if pos else ""
    principal = _frase(pos, nom)
    resto = _limpiar(m.group(2)).lstrip(".,; ")
    if principal and resto:
        # «Del latín carnalis» + «de caro» -> una sola frase si el resto continúa en minúscula
        texto = f"{principal}, {resto}" if resto[0].islower() else f"{principal}. {resto}"
    else:
        texto = (principal or resto).strip()
    texto = texto[:1].upper() + texto[1:]
    # Se cortan las cadenas de protolenguas (*reconstrucciones, códigos técnicos): no aportan al público general
    tecnico = re.compile(r"\*|\b(?:gmh|goh|gem|gem-pro|ine-pro|cel-\w+|gmw-pro|bft|tpn|ine)\b|protoindoeuropeo")
    clausulas = re.split(r"(?<=[,;.]) ", texto)
    for i, c in enumerate(clausulas):
        if i and tecnico.search(c):
            texto = " ".join(clausulas[:i]).rstrip(",;") + "."
            break
    if texto and not texto.endswith("."):
        texto += "."
    if len(texto) > 300:
        texto = texto[:300].rsplit(" ", 1)[0] + "…"
    grupo = next((g for g, cods in GRUPOS.items() if codigo in cods), None)
    if not grupo:
        grupo = "formacion" if codigo in FORMACION else "incierto"
    if not texto:
        return None
    return {"texto": texto, "codigo": codigo, "grupo": grupo,
            "lengua": LENGUAS.get(codigo, ""), "etimo": pos[1] if len(pos) > 1 and codigo in LENGUAS else ""}
