import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const cache = new Map();
const authActions = [];

function resolveLocal(name, parent) {
  const base = name.startsWith("@/")
    ? path.resolve(name.slice(2))
    : path.resolve(path.dirname(parent), name);
  for (const extension of [".ts", ".tsx"]) {
    if (fs.existsSync(base + extension)) return base + extension;
  }
  throw new Error(`Cannot resolve ${name} from ${parent}`);
}

function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = { exports: {} };
  cache.set(file, loaded);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name.endsWith(".module.css")) {
      return new Proxy({}, { get: (_target, property) => String(property) });
    }
    if (name === "next-auth/react") {
      return {
        signIn: (...args) => authActions.push(["in", ...args]),
        signOut: (...args) => authActions.push(["out", ...args]),
      };
    }
    if (name.startsWith(".") || name.startsWith("@/")) {
      return load(resolveLocal(name, file));
    }
    return nodeRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const {
  getAuthReadiness,
  isAllowedEmail,
  JUDGE_EMAIL,
  normalizeEmail,
} = load("lib/auth/policy.ts");
const { getAuthenticatedIdentity } = load("lib/auth/identity.ts");
const { authOptions } = load('lib/auth/options.ts');
const signIn = authOptions.callbacks.signIn;
const verified = { user: { email: 'student@yale.edu' }, account: { provider: 'google' }, profile: { email: 'student@yale.edu', email_verified: true } };
assert.equal(await signIn(verified), true);
assert.equal(await signIn({ ...verified, profile: { ...verified.profile, email_verified: false } }), false);
assert.equal(await signIn({ ...verified, profile: { email: 'student@yale.edu' } }), false);
assert.equal(await signIn({ ...verified, profile: { ...verified.profile, email: 'other@yale.edu' } }), false);
assert.equal(await signIn({ ...verified, account: { provider: 'unrecognized' } }), false);
assert.equal(await signIn({ ...verified, profile: undefined }), false);
const { SignInPanel } = load("app/(auth)/sign-in/SignInPanel.tsx");
const React = nodeRequire("react");
const { renderToStaticMarkup } = nodeRequire("react-dom/server");

assert.equal(normalizeEmail("  Student@YALE.EDU "), "student@yale.edu");
assert.equal(isAllowedEmail("student@yale.edu"), true);
assert.equal(isAllowedEmail("STUDENT@YALE.EDU"), true);
assert.equal(isAllowedEmail(JUDGE_EMAIL), true);
assert.equal(isAllowedEmail("student@yale.edu.example.com"), false);
assert.equal(isAllowedEmail("attacker@@yale.edu"), false);
assert.equal(isAllowedEmail("student @yale.edu"), false);
assert.equal(isAllowedEmail("student@gmail.com"), false);
assert.equal(isAllowedEmail(null), false);

assert.deepEqual(getAuthReadiness({}), {
  ready: false,
  missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET"],
});
assert.deepEqual(
  getAuthReadiness({
    GOOGLE_CLIENT_ID: "client",
    GOOGLE_CLIENT_SECRET: "secret",
    NEXTAUTH_SECRET: "session-secret",
  }),
  { ready: true, missing: [] },
);

assert.deepEqual(
  getAuthenticatedIdentity({
    user: {
      email: " STUDENT@YALE.EDU ",
      name: "  Alex Student  ",
    },
    expires: "2099-01-01T00:00:00.000Z",
  }),
  { email: "student@yale.edu", name: "Alex Student" },
);
assert.equal(
  getAuthenticatedIdentity({
    user: { email: "student@gmail.com" },
    expires: "2099-01-01T00:00:00.000Z",
  }),
  null,
);
assert.equal(getAuthenticatedIdentity(null), null);

const missingHtml = renderToStaticMarkup(
  React.createElement(SignInPanel, {
    configured: false,
    identity: null,
    missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  }),
);
assert.match(missingHtml, /Authentication is not configured/);
assert.match(missingHtml, /GOOGLE_CLIENT_ID/);
assert.match(missingHtml, /disabled=""/);
assert.doesNotMatch(missingHtml, /fake|preloaded course/i);

const signedInHtml = renderToStaticMarkup(
  React.createElement(SignInPanel, {
    configured: true,
    identity: { email: "student@yale.edu", name: "Alex" },
    missing: [],
  }),
);
assert.match(signedInHtml, /You are signed in/);
assert.match(signedInHtml, /student@yale.edu/);
assert.match(signedInHtml, /Continue to the tutor/);
assert.match(signedInHtml, /Sign out/);

console.log(
  "PASS: Yale/judge policy, configuration checks, normalized identity, and honest sign-in states.",
);
