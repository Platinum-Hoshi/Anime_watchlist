from anilist import get_anime

anime_name = input("Anime eingeben: ")

anime = get_anime(anime_name)

print("\n=== Ergebnis ===")
print(anime["title"]["romaji"])
print("ID:", anime["id"])
print("Titel:", anime["title"]["english"], "-", anime["title"]["romaji"], "(", anime["title"]["native"], ")")
print("Veröffentlichung:", anime["seasonYear"])
print("Status:", anime["status"])
print("Format:", anime["format"])
print("Genres:", ", ".join(anime["genres"]))
print("Episoden", anime["episodes"])
print("")
print("=== Beschreibung ===")
print(anime["description"])
print("")
print("=== Relations ===")
for relation in anime["relations"]["edges"]:
    print(
        relation["relationType"],
        "-",
        relation["node"]["format"],
        "-",
        relation["node"]["id"],
        "|",
        relation["node"]["title"]["english"], "-", relation["node"]["title"]["romaji"], "(", relation["node"]["title"]["native"], ")",
        "Episoden:", relation["node"]["episodes"]
    )