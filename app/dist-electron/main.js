import { BrowserWindow as e, app as t, dialog as n, ipcMain as r, net as i, protocol as a, session as o } from "electron";
import { promises as s } from "node:fs";
import c from "node:path";
import { fileURLToPath as l, pathToFileURL as u } from "node:url";
//#region electron/main.ts
var d = {
	pickFolder: "desktop:pick-folder",
	refreshFolder: "desktop:refresh-folder",
	readTrack: "desktop:read-track"
}, f = new Set([
	".aac",
	".aif",
	".aiff",
	".flac",
	".m4a",
	".m4b",
	".m4v",
	".mkv",
	".mov",
	".mp3",
	".mp4",
	".oga",
	".ogg",
	".opus",
	".wav",
	".weba",
	".webm",
	".wma"
]), p = {
	".aac": "audio/aac",
	".aif": "audio/aiff",
	".aiff": "audio/aiff",
	".flac": "audio/flac",
	".m4a": "audio/mp4",
	".m4b": "audio/mp4",
	".m4v": "video/mp4",
	".mkv": "video/x-matroska",
	".mov": "video/quicktime",
	".mp3": "audio/mpeg",
	".mp4": "video/mp4",
	".oga": "audio/ogg",
	".ogg": "audio/ogg",
	".opus": "audio/ogg",
	".wav": "audio/wav",
	".weba": "audio/webm",
	".webm": "video/webm",
	".wma": "audio/x-ms-wma"
}, m = l(import.meta.url), h = c.dirname(m), g = c.join(h, "../dist"), _ = "modaudio", v = "app", y = `${_}://${v}/index.html`, b = 128, x = 4096, S = 200, C = "folder-allowlist.v1.json";
a.registerSchemesAsPrivileged([{
	scheme: _,
	privileges: {
		standard: !0,
		secure: !0,
		supportFetchAPI: !0,
		stream: !0
	}
}]);
var w = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), D = 1;
function O(e) {
	return {
		ok: !0,
		data: e
	};
}
function k(e, t) {
	return {
		ok: !1,
		code: e,
		message: t
	};
}
function A(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function j(e) {
	return c.resolve(e);
}
function M(e, t) {
	return c.relative(e, t).split(c.sep).join("/");
}
function N(e, t) {
	let n = c.relative(e, t);
	return n === "" || !n.startsWith("..") && !c.isAbsolute(n);
}
function P(e) {
	return e.byteOffset === 0 && e.byteLength === e.buffer.byteLength ? e.buffer : e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
}
function F(e, t, n) {
	if (!A(e)) return null;
	let r = e[t];
	return typeof r != "string" || r.length === 0 || r.length > n || r.includes("\0") ? null : r;
}
function I(e) {
	return c.isAbsolute(e) || e.startsWith("/") || e.startsWith("\\") ? !1 : e.replace(/\\/g, "/").split("/").every((e) => e !== "" && e !== "." && e !== "..");
}
function L(e) {
	try {
		let t = new URL(e);
		if (t.protocol === `${_}:`) return t.hostname === v;
		let n = process.env.VITE_DEV_SERVER_URL;
		if (!n) return !1;
		let r = new URL(n);
		return t.origin === r.origin;
	} catch {
		return !1;
	}
}
function R(e) {
	return L(e.senderFrame?.url || e.sender.getURL()) ? null : k("IPC_SENDER_FORBIDDEN", "IPC sender is not trusted.");
}
function z(e) {
	try {
		let t = new URL(e);
		if (t.protocol !== `${_}:` || t.hostname !== v) return null;
		let n = decodeURIComponent(t.pathname === "/" ? "/index.html" : t.pathname).slice(1), r = j(c.join(g, n));
		return N(g, r) ? r : null;
	} catch {
		return null;
	}
}
function B() {
	a.handle(_, async (e) => {
		let t = z(e.url);
		if (!t) return new Response("Not found", { status: 404 });
		try {
			return (await s.stat(t)).isFile() ? i.fetch(u(t).toString()) : new Response("Not found", { status: 404 });
		} catch {
			return new Response("Not found", { status: 404 });
		}
	});
}
function V(e) {
	let t = (e, t) => {
		L(t) || e.preventDefault();
	};
	e.webContents.on("will-navigate", t), e.webContents.on("will-redirect", t), e.webContents.on("will-attach-webview", (e) => e.preventDefault()), e.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
async function H() {
	await new Promise((e) => {
		setImmediate(e);
	});
}
function U(e) {
	return f.has(c.extname(e).toLowerCase());
}
function W() {
	return c.join(t.getPath("userData"), C);
}
function G() {
	let e = 1;
	for (let t of T.keys()) {
		let n = /^folder_(\d+)$/.exec(t);
		if (!n) continue;
		let r = Number.parseInt(n[1], 10);
		Number.isFinite(r) && (e = Math.max(e, r + 1));
	}
	D = e;
}
async function K() {
	let e = W();
	try {
		let t = await s.readFile(e, "utf-8"), n = JSON.parse(t);
		if (n.version !== 1 || !Array.isArray(n.folders)) return;
		for (let e of n.folders) {
			if (!e || typeof e.folderId != "string" || typeof e.rootPath != "string") continue;
			let t = e.folderId.trim(), n = e.rootPath.trim();
			if (!t || !n || t.length > b || t.includes("\0") || n.includes("\0")) continue;
			let r = j(n);
			w.set(r, t), T.set(t, r);
		}
		G();
	} catch (e) {
		e instanceof Error && "code" in e && e.code === "ENOENT" || console.warn("Failed to load persisted folder allowlist.", e);
	}
}
async function q() {
	let e = W(), t = {
		version: 1,
		folders: Array.from(T.entries()).map(([e, t]) => ({
			folderId: e,
			rootPath: t
		}))
	};
	t.folders.sort((e, t) => e.folderId.localeCompare(t.folderId)), await s.mkdir(c.dirname(e), { recursive: !0 }), await s.writeFile(e, JSON.stringify(t), "utf-8");
}
function J(e) {
	let t = w.get(e);
	if (t) return t;
	let n = `folder_${D}`;
	for (; T.has(n);) D += 1, n = `folder_${D}`;
	return D += 1, w.set(e, n), T.set(n, e), n;
}
async function Y(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = j(e), i = J(r), a = 0;
	async function o(e) {
		let i = await s.readdir(e, { withFileTypes: !0 });
		for (let l of i) {
			a += 1, a % S === 0 && await H();
			let i = c.join(e, l.name);
			if (l.isSymbolicLink()) continue;
			if (l.isDirectory()) {
				await o(i);
				continue;
			}
			if (!l.isFile() || !U(i)) continue;
			let u = await s.stat(i), d = M(r, i), f = `${d}:${u.size}:${Math.trunc(u.mtimeMs)}`, p = {
				id: f,
				name: l.name,
				relativePath: d,
				fingerprint: f,
				size: u.size,
				lastModified: Math.trunc(u.mtimeMs)
			};
			t.push(p), n.set(d, {
				absolutePath: i,
				track: p
			});
		}
	}
	return await o(r), t.sort((e, t) => e.relativePath.localeCompare(t.relativePath, void 0, { sensitivity: "base" })), {
		folderId: i,
		rootPath: r,
		tracks: t,
		byRelativePath: n
	};
}
async function X() {
	let t = new e({
		width: 1680,
		height: 920,
		show: !1,
		webPreferences: {
			preload: c.join(h, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !0
		}
	});
	V(t), t.once("ready-to-show", () => {
		t.show();
	});
	let n = process.env.VITE_DEV_SERVER_URL;
	return n ? await t.loadURL(n) : await t.loadURL(y), t;
}
function Z() {
	r.handle(d.pickFolder, async (t) => {
		let r = R(t);
		if (r) return r;
		let i = e.getFocusedWindow(), a = {
			title: "Select music folder",
			properties: ["openDirectory", "dontAddToRecent"]
		}, o = i ? await n.showOpenDialog(i, a) : await n.showOpenDialog(a);
		if (o.canceled || o.filePaths.length === 0) return k("PICKER_CANCELLED", "Folder selection cancelled.");
		let s = j(o.filePaths[0]);
		try {
			let e = await Y(s);
			E.set(e.folderId, e);
			try {
				await q();
			} catch (e) {
				console.warn("Failed to persist folder allowlist.", e);
			}
			return O({
				folderId: e.folderId,
				folderName: c.basename(e.rootPath),
				tracks: e.tracks
			});
		} catch (e) {
			return k("SCAN_FAILED", e instanceof Error ? e.message : "Failed to scan folder.");
		}
	}), r.handle(d.refreshFolder, async (e, t) => {
		let n = R(e);
		if (n) return n;
		let r = F(t, "folderId", b) ?? "";
		if (!r) return k("FOLDER_FORBIDDEN", "Folder id is not in allowlist.");
		let i = E.get(r);
		if (!i) {
			let e = T.get(r);
			if (!e) return k("FOLDER_FORBIDDEN", "Folder id is not in allowlist.");
			try {
				i = {
					...await Y(e),
					folderId: r
				}, E.set(r, i);
			} catch (e) {
				return k("SCAN_FAILED", e instanceof Error ? e.message : "Failed to refresh folder.");
			}
		}
		try {
			let e = {
				...await Y(i.rootPath),
				folderId: i.folderId
			};
			return E.set(r, e), O({ tracks: e.tracks });
		} catch (e) {
			return k("SCAN_FAILED", e instanceof Error ? e.message : "Failed to refresh folder.");
		}
	}), r.handle(d.readTrack, async (e, t) => {
		let n = R(e);
		if (n) return n;
		let r = F(t, "folderId", b) ?? "", i = F(t, "relativePath", x) ?? "", a = E.get(r);
		if (!a && r) {
			let e = T.get(r);
			if (e) try {
				a = {
					...await Y(e),
					folderId: r
				}, E.set(r, a);
			} catch (e) {
				return k("SCAN_FAILED", e instanceof Error ? e.message : "Failed to refresh folder.");
			}
		}
		if (!a) return k("TRACK_FORBIDDEN", "Folder id is not in allowlist.");
		if (!I(i)) return k("TRACK_FORBIDDEN", "Track path is not valid.");
		let o = a.byRelativePath.get(i);
		if (!o || !N(a.rootPath, o.absolutePath)) return k("TRACK_FORBIDDEN", "Track path is not in allowlist.");
		try {
			let [e, t] = await Promise.all([s.stat(o.absolutePath), s.readFile(o.absolutePath)]);
			if (!e.isFile()) return k("TRACK_NOT_FILE", "Track path is not a file.");
			let n = c.extname(o.absolutePath).toLowerCase();
			return O({
				name: c.basename(o.absolutePath),
				mimeType: p[n] ?? "application/octet-stream",
				arrayBuffer: P(t)
			});
		} catch (e) {
			return k("READ_FAILED", e instanceof Error ? e.message : "Failed to read track.");
		}
	});
}
t.whenReady().then(async () => {
	await K(), B(), o.defaultSession.setPermissionRequestHandler((e, t, n) => n(!1)), Z(), await X(), t.on("activate", async () => {
		e.getAllWindows().length === 0 && await X();
	});
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion
export {};
