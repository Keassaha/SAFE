import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/.git/**", "**/.claude/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` est un marqueur Next.js : son seul rôle est de faire ÉCHOUER
      // le build si un module serveur est importé depuis un composant client. Le
      // paquet n'est pas installé ici, et sous vitest il n'a aucune raison d'être :
      // les tests s'exécutent déjà côté Node.
      //
      // Sans cet alias, tout fichier de test qui touche un module marqué
      // `import "server-only"` échoue au chargement — c'est ce qui masquait
      // `ready-for-review-detection-hooks.test.ts` (défaut introduit par le commit
      // a300a7d). Un fichier de tests qui ne se charge pas ne signale aucune
      // régression, ce qui est pire qu'un test rouge.
      "server-only": path.resolve(__dirname, "lib/__mocks__/server-only.ts"),
    },
  },
});
