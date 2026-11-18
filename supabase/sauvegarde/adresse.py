"""Examine l'adresse de connexion à une base Supabase (secret SUPABASE_BASE_…).

N'affiche JAMAIS l'adresse elle-même : elle contient le mot de passe de la base.

Usage :
  python3 -I adresse.py nettoyer <valeur>    -> l'adresse postgresql://… seule (sortie capturée)
  python3 -I adresse.py diagnostic <valeur>  -> un code : ok, vide, jdbc, psql, parametres,
                                                site, autre, incomplete
  python3 -I adresse.py motdepasse <adresse> -> le mot de passe (pour le masquer)
  python3 -I adresse.py identifiant <adresse> -> l'identifiant du projet (postgres.<identifiant>)
"""

import re
import sys
import urllib.parse

# Une adresse de base, où qu'elle soit dans le texte collé : seule, entre guillemets,
# après « DATABASE_URL= », dans une commande psql…
MOTIF = re.compile(r"postgres(?:ql)?://[^\s'\"<>`]+")


def nettoyer(valeur: str) -> str:
    trouve = MOTIF.search(valeur)
    if trouve is not None:
        return trouve.group(0)
    return valeur.strip().strip("\"'").strip()


def diagnostic(valeur: str) -> str:
    texte = valeur.strip()
    if texte == "":
        return "vide"
    if MOTIF.search(texte) is not None:
        return "jdbc" if "jdbc:" in texte.lower() else "ok"
    if texte.lower().startswith("psql"):
        return "psql"
    if "host=" in texte:
        return "parametres"
    if texte.lower().startswith(("http://", "https://")):
        return "site"
    if "://" in texte:
        return "autre"
    return "incomplete"


def motdepasse(adresse: str) -> str:
    return urllib.parse.urlsplit(adresse).password or ""


def identifiant(adresse: str) -> str:
    nom = urllib.parse.urlsplit(adresse).username or ""
    return nom.split(".", 1)[1] if "." in nom else ""


if __name__ == "__main__":
    action, valeur = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""
    if action == "nettoyer":
        print(nettoyer(valeur))
    elif action == "diagnostic":
        print(diagnostic(valeur))
    elif action == "motdepasse":
        brut = motdepasse(valeur)
        print(brut)
        print(urllib.parse.unquote(brut))
    elif action == "identifiant":
        print(identifiant(valeur))
    else:
        sys.exit(f"Action inconnue : {action}")
