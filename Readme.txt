Workflow complet :

Ouvre ton site classique : pas de boutons d'ajout, données tirées du .json.

Ajoute #admin à l'URL et appuie sur Entrée (puis rafraîchis la page F5).

Ajoute tes listes et tes mots via l'interface.

Clique sur Export JSON. Cela télécharge le fichier data.json.

Remplace l'ancien data.json par le nouveau dans ton dossier local, ajoute tes nouveaux fichiers audios dans audio/, fais un git commit et un git push. La page sera mise à jour pour tous.

Note : La fonction fetch('data.json') est bloquée par les navigateurs si tu ouvres directement le fichier local (file:///.../index.html). Tu dois tester ton site en utilisant GitHub Pages directement, ou un serveur local (ex: extension Live Server sur VS Code).