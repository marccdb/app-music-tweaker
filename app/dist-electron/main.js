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
}, m = l(import.meta.url), h = c.dirname(m), g = c.join(h, "../dist"), _ = "tuneforge", v = "app", y = `${_}://${v}/index.html`, b = 128, x = 4096, S = 200;
a.registerSchemesAsPrivileged([{
	scheme: _,
	privileges: {
		standard: !0,
		secure: !0,
		supportFetchAPI: !0,
		stream: !0
	}
}]);
var C = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ new Map(), T = 1;
function E(e) {
	return {
		ok: !0,
		data: e
	};
}
function D(e, t) {
	return {
		ok: !1,
		code: e,
		message: t
	};
}
function O(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function k(e) {
	return c.resolve(e);
}
function A(e, t) {
	return c.relative(e, t).split(c.sep).join("/");
}
function j(e, t) {
	let n = c.relative(e, t);
	return n === "" || !n.startsWith("..") && !c.isAbsolute(n);
}
function M(e) {
	return e.byteOffset === 0 && e.byteLength === e.buffer.byteLength ? e.buffer : e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
}
function N(e, t, n) {
	if (!O(e)) return null;
	let r = e[t];
	return typeof r != "string" || r.length === 0 || r.length > n || r.includes("\0") ? null : r;
}
function P(e) {
	return c.isAbsolute(e) || e.startsWith("/") || e.startsWith("\\") ? !1 : e.replace(/\\/g, "/").split("/").every((e) => e !== "" && e !== "." && e !== "..");
}
function F(e) {
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
function I(e) {
	return F(e.senderFrame?.url || e.sender.getURL()) ? null : D("IPC_SENDER_FORBIDDEN", "IPC sender is not trusted.");
}
function L(e) {
	try {
		let t = new URL(e);
		if (t.protocol !== `${_}:` || t.hostname !== v) return null;
		let n = decodeURIComponent(t.pathname === "/" ? "/index.html" : t.pathname).slice(1), r = k(c.join(g, n));
		return j(g, r) ? r : null;
	} catch {
		return null;
	}
}
function R() {
	a.handle(_, async (e) => {
		let t = L(e.url);
		if (!t) return new Response("Not found", { status: 404 });
		try {
			return (await s.stat(t)).isFile() ? i.fetch(u(t).toString()) : new Response("Not found", { status: 404 });
		} catch {
			return new Response("Not found", { status: 404 });
		}
	});
}
function z(e) {
	let t = (e, t) => {
		F(t) || e.preventDefault();
	};
	e.webContents.on("will-navigate", t), e.webContents.on("will-redirect", t), e.webContents.on("will-attach-webview", (e) => e.preventDefault()), e.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
async function B() {
	await new Promise((e) => {
		setImmediate(e);
	});
}
function V(e) {
	return f.has(c.extname(e).toLowerCase());
}
function H(e) {
	let t = C.get(e);
	if (t) return t;
	let n = `folder_${T++}`;
	return C.set(e, n), n;
}
async function U(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = k(e), i = H(r), a = 0;
	async function o(e) {
		let i = await s.readdir(e, { withFileTypes: !0 });
		for (let l of i) {
			a += 1, a % S === 0 && await B();
			let i = c.join(e, l.name);
			if (l.isSymbolicLink()) continue;
			if (l.isDirectory()) {
				await o(i);
				continue;
			}
			if (!l.isFile() || !V(i)) continue;
			let u = await s.stat(i), d = A(r, i), f = `${d}:${u.size}:${Math.trunc(u.mtimeMs)}`, p = {
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
async function W() {
	let t = new e({
		width: 1400,
		height: 920,
		show: !1,
		webPreferences: {
			preload: c.join(h, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !0
		}
	});
	z(t), t.once("ready-to-show", () => {
		t.show();
	});
	let n = process.env.VITE_DEV_SERVER_URL;
	return n ? await t.loadURL(n) : await t.loadURL(y), t;
}
function G() {
	r.handle(d.pickFolder, async (t) => {
		let r = I(t);
		if (r) return r;
		let i = e.getFocusedWindow(), a = {
			title: "Select music folder",
			properties: ["openDirectory", "dontAddToRecent"]
		}, o = i ? await n.showOpenDialog(i, a) : await n.showOpenDialog(a);
		if (o.canceled || o.filePaths.length === 0) return D("PICKER_CANCELLED", "Folder selection cancelled.");
		let s = k(o.filePaths[0]);
		try {
			let e = await U(s);
			return w.set(e.folderId, e), E({
				folderId: e.folderId,
				folderName: c.basename(e.rootPath),
				tracks: e.tracks
			});
		} catch (e) {
			return D("SCAN_FAILED", e instanceof Error ? e.message : "Failed to scan folder.");
		}
	}), r.handle(d.refreshFolder, async (e, t) => {
		let n = I(e);
		if (n) return n;
		let r = N(t, "folderId", b) ?? "", i = w.get(r);
		if (!r || !i) return D("FOLDER_FORBIDDEN", "Folder id is not in allowlist.");
		try {
			let e = {
				...await U(i.rootPath),
				folderId: i.folderId
			};
			return w.set(r, e), E({ tracks: e.tracks });
		} catch (e) {
			return D("SCAN_FAILED", e instanceof Error ? e.message : "Failed to refresh folder.");
		}
	}), r.handle(d.readTrack, async (e, t) => {
		let n = I(e);
		if (n) return n;
		let r = N(t, "folderId", b) ?? "", i = N(t, "relativePath", x) ?? "", a = w.get(r);
		if (!a) return D("TRACK_FORBIDDEN", "Folder id is not in allowlist.");
		if (!P(i)) return D("TRACK_FORBIDDEN", "Track path is not valid.");
		let o = a.byRelativePath.get(i);
		if (!o || !j(a.rootPath, o.absolutePath)) return D("TRACK_FORBIDDEN", "Track path is not in allowlist.");
		try {
			let [e, t] = await Promise.all([s.stat(o.absolutePath), s.readFile(o.absolutePath)]);
			if (!e.isFile()) return D("TRACK_NOT_FILE", "Track path is not a file.");
			let n = c.extname(o.absolutePath).toLowerCase();
			return E({
				name: c.basename(o.absolutePath),
				mimeType: p[n] ?? "application/octet-stream",
				arrayBuffer: M(t)
			});
		} catch (e) {
			return D("READ_FAILED", e instanceof Error ? e.message : "Failed to read track.");
		}
	});
}
t.whenReady().then(async () => {
	R(), o.defaultSession.setPermissionRequestHandler((e, t, n) => n(!1)), G(), await W(), t.on("activate", async () => {
		e.getAllWindows().length === 0 && await W();
	});
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion
