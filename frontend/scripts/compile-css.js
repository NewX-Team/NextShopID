const fs = require("node:fs");
const path = require("node:path");
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

const frontendDir = path.resolve(__dirname, "..");
const globalsCssPath = path.join(frontendDir, "app", "globals.css");

async function compileCss() {
  const startTime = Date.now();
  const srcCss = `
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
`;

  try {
    const compiler = await compile(srcCss, {
      base: frontendDir,
      from: globalsCssPath,
      onDependency: () => {},
    });

    const scanner = new Scanner({
      sources: [
        { base: path.join(frontendDir, "app"), pattern: "**/*", negated: false },
        { base: path.join(frontendDir, "components"), pattern: "**/*", negated: false },
        { base: path.join(frontendDir, "context"), pattern: "**/*", negated: false },
      ],
    });

    const candidates = scanner.scan();
    const compiled = compiler.build(candidates);

    const customOverrides = `
/* Custom Base Tokens & Antialiasing */
:root {
  --background: #ffffff;
  --foreground: #0f172a;
}

.dark {
  --background: #0b0f19;
  --foreground: #f8fafc;
  color-scheme: dark;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, -apple-system, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transition: background-color 0.2s ease, color 0.2s ease;
}
`;

    fs.writeFileSync(globalsCssPath, compiled + "\n" + customOverrides, "utf8");
    const elapsed = Date.now() - startTime;
    console.log(`[Tailwind CSS] Berhasil dikompilasi (${candidates.length} candidates, ${(compiled.length / 1024).toFixed(1)} KB) dalam ${elapsed}ms`);
  } catch (err) {
    console.error("[Tailwind CSS] Gagal kompilasi CSS:", err);
  }
}

// Jalankan kompilasi awal
compileCss();

// Jika dipanggil dengan flag --watch, pantau perubahan file di app/, components/, context/
if (process.argv.includes("--watch")) {
  let debounceTimeout = null;
  const watchDirs = [
    path.join(frontendDir, "app"),
    path.join(frontendDir, "components"),
    path.join(frontendDir, "context"),
  ];

  console.log("[Tailwind CSS] Menjalankan file watcher untuk auto-recompile...");

  for (const dir of watchDirs) {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (_eventType, filename) => {
        if (!filename || filename === "globals.css") return;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          compileCss();
        }, 120);
      });
    }
  }
}
