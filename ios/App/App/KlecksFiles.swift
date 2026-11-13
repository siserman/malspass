import Foundation
import Capacitor

/// The fridge as files. Every picture is four files in Documents/Bilder,
/// named by the picture's id:
///
///   <id>.jpg         the picture
///   <id>.thumb.jpg   the small one for the fridge door
///   <id>.rec.json    the recording (strokes), for the time-lapse and Weitermalen
///   <id>.json        the small record the fridge lists; written last, so a
///                    picture only appears once all of it is on disk
///
/// Documents is part of the device backup, and unlike the web view's storage
/// nothing but the app and the parent can remove what is in it.
@objc(KlecksFilesPlugin)
public class KlecksFilesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KlecksFilesPlugin"
    public let jsName = "KlecksFiles"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "list", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMeta", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    private let fm = FileManager.default
    private let queue = DispatchQueue(label: "klecks.files")

    private func dir() throws -> URL {
        let docs = try fm.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let d = docs.appendingPathComponent("Bilder", isDirectory: true)
        if !fm.fileExists(atPath: d.path) {
            try fm.createDirectory(at: d, withIntermediateDirectories: true)
        }
        return d
    }

    /// Ids are the time a picture was made, in milliseconds: digits only.
    private func name(_ call: CAPPluginCall) -> String? {
        guard let id = call.getString("id"), !id.isEmpty, id.count <= 20,
              id.allSatisfy({ $0 >= "0" && $0 <= "9" }) else {
            call.reject("bad id")
            return nil
        }
        return id
    }

    private func run(_ call: CAPPluginCall, _ work: @escaping () throws -> [String: Any]) {
        queue.async {
            do { call.resolve(try work()) } catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func list(_ call: CAPPluginCall) {
        run(call) {
            let d = try self.dir()
            var items: [String] = []
            for f in try self.fm.contentsOfDirectory(atPath: d.path) where f.hasSuffix(".json") && !f.hasSuffix(".rec.json") {
                let base = String(f.dropLast(5))
                // a record without its picture is a write that never finished
                guard self.fm.fileExists(atPath: d.appendingPathComponent(base + ".jpg").path),
                      let s = try? String(contentsOf: d.appendingPathComponent(f), encoding: .utf8) else { continue }
                items.append(s)
            }
            return ["dir": d.path, "items": items]
        }
    }

    @objc func read(_ call: CAPPluginCall) {
        guard let id = name(call) else { return }
        run(call) {
            let d = try self.dir()
            let img = try Data(contentsOf: d.appendingPathComponent(id + ".jpg"))
            let rec = (try? String(contentsOf: d.appendingPathComponent(id + ".rec.json"), encoding: .utf8)) ?? ""
            return ["img": img.base64EncodedString(), "rec": rec]
        }
    }

    @objc func write(_ call: CAPPluginCall) {
        guard let id = name(call) else { return }
        guard let meta = call.getString("meta"), let rec = call.getString("rec"),
              let img = Data(base64Encoded: call.getString("img") ?? ""), !img.isEmpty else {
            call.reject("incomplete picture")
            return
        }
        let thumb = Data(base64Encoded: call.getString("thumb") ?? "")
        run(call) {
            let d = try self.dir()
            try img.write(to: d.appendingPathComponent(id + ".jpg"), options: .atomic)
            if let t = thumb, !t.isEmpty {
                try t.write(to: d.appendingPathComponent(id + ".thumb.jpg"), options: .atomic)
            }
            try Data(rec.utf8).write(to: d.appendingPathComponent(id + ".rec.json"), options: .atomic)
            try Data(meta.utf8).write(to: d.appendingPathComponent(id + ".json"), options: .atomic)
            return [:]
        }
    }

    @objc func setMeta(_ call: CAPPluginCall) {
        guard let id = name(call) else { return }
        guard let meta = call.getString("meta") else { call.reject("no record"); return }
        run(call) {
            try Data(meta.utf8).write(to: try self.dir().appendingPathComponent(id + ".json"), options: .atomic)
            return [:]
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let id = name(call) else { return }
        run(call) {
            let d = try self.dir()
            // the record first: without it the picture is gone from the fridge
            for ext in [".json", ".rec.json", ".thumb.jpg", ".jpg"] {
                let f = d.appendingPathComponent(id + ext)
                if self.fm.fileExists(atPath: f.path) { try self.fm.removeItem(at: f) }
            }
            return [:]
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        run(call) {
            let d = try self.dir()
            for f in try self.fm.contentsOfDirectory(atPath: d.path) {
                try self.fm.removeItem(at: d.appendingPathComponent(f))
            }
            return [:]
        }
    }
}
