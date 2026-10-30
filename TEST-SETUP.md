# FITIA PRO TEST — état et mise en service

Copie du commit `30d35fe307e1c1f97abcd948cf3b51c64273f4af` de l'application officielle, sans l'APK officiel. Ne réutilisez jamais les identifiants, clés de signature, secrets, jetons GitHub, données clients ou base de production.

## État actuel

- Identifiant Android `com.fitia.miningpro.test`, nom `FITIA PRO TEST`, autorité de mise à jour et schéma de lien distincts. Co-installation prévue mais pas encore vérifiée sur appareil : aucun APK de test n'a été construit.
- Vercel : projet `fitia-mining-pro-test` créé et lié au dépôt de test. Pas encore de déploiement exploitable. La clé Supabase est enregistrée comme variable sensible uniquement pour l’environnement production de ce projet de test ; sa validité reste à vérifier après déploiement.
- Supabase : projet de test `nywxtykuouywmskavrya`, distinct de la production ; URL épinglée dans `farm-service.js` et `store-order-service.js`. Les tables STORE/FARM et les fonctions finales ont été créées sur cette base vide et leurs droits vérifiés. Le projet Vercel contient l’URL publique et une variable sensible pour la clé serveur ; la connexion effective n’a pas encore été vérifiée.
- Les manifestes sont désactivés, sans URL ni empreinte. L'APK officiel et son certificat ne sont pas utilisés. Les futures URLs de publication sont limitées au dépôt `web3service/fitia-mining-pro-test`.
- **Ce n'est pas un sandbox blockchain complet.** La configuration héritée lit encore Polygon Mainnet et ses contrats, ce qui peut communiquer des adresses à des RPC publics. Les signatures et envois de transactions via le portefeuille sont bloqués, ainsi que la vérification de paiements dans les services par défaut. N'importez jamais de wallet réel ; les produits et contenus hérités ne sont pas des données de test garanties.

## Étapes restantes

1. Vérifier l’offre et les coûts du projet Supabase de test. Configurer côté serveur les secrets spécifiques à ce projet et un mot de passe admin propre au test dans Vercel. Prévoir un jeton GitHub à portée limitée au seul dépôt de test ; ne le collez jamais dans le code ou dans la conversation. L'administration refuse tout autre dépôt.
2. Mettre en place un réseau blockchain de test et ses contrats/actifs/treasury isolés avant de lever les blocages ; auditer chaque chemin de transaction et de paiement. Ne jamais pointer vers la trésorerie ou les contrats de production.
3. Créer et sauvegarder séparément un keystore de signature **de test**, puis épingler sa seule empreinte SHA-256 publique dans `android-src/release-certificate-sha256.txt`. Configurer les secrets GitHub Actions `FITIA_TEST_ANDROID_KEYSTORE_BASE64` et `FITIA_TEST_ANDROID_KEYSTORE_PASSWORD` dans le dépôt de test ; ne pas utiliser la clé officielle. Construire et vérifier l'APK (package, nom, certificat, co-installation et mises à jour) avant toute publication. La clé doit être conservée durablement pour les mises à jour ultérieures.
4. Après validation et déploiement, générer le manifeste avec `scripts/update_release_manifest.py` et publier explicitement la release dans le dépôt de test. Les workflows utilisent des secrets de test et la publication est manuelle.

Les changements de cette session sont sur la branche Arena ; ni le dépôt officiel ni sa configuration n'ont été modifiés.

## Historique des migrations

Le projet de test a reçu trois migrations : création des commandes, création FARM puis fonction Arcade finale. Les versions SQL intermédiaires Lucky Wheel et Dice ne modifiaient que cette même fonction et ont été remplacées directement par sa version finale. Elles sont conservées à titre de référence dans `supabase/reference-migrations/` et ne doivent pas être appliquées après la fonction Arcade. Les noms et versions dans `supabase/migrations/` correspondent à l’historique distant du projet de test.
