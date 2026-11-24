import SwiftUI
import FirebaseCore
import FirebaseAuth
import FirebaseDatabase

/// Staging only; never exposes score or clock mutation.
struct FirebaseStagingView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var status = "Not signed in"
    @State private var snapshot = ""
    @State private var connected = false
    @State private var busy = false
    @State private var stateRef: DatabaseReference?
    @State private var stateHandle: DatabaseHandle?
    @State private var connectionRef: DatabaseReference?
    @State private var connectionHandle: DatabaseHandle?
    @State private var generation = UUID()

    private let project = "jesuit-scoreboards-2-0-staging"
    private let url = "https://jesuit-scoreboards-2-0-staging-default-rtdb.firebaseio.com"

    var body: some View {
        NavigationStack {
            Form {
                Section("OFF-AIR • STAGING ONLY") {
                    Text(project).font(.caption)
                    Text(connected ? "Database connected" : "Database disconnected")
                    Text(status)
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                    SecureField("Password", text: $password)
                    Button("Sign in and subscribe") { Task { await signIn() } }
                        .disabled(busy || email.isEmpty || password.isEmpty)
                    Button("Disconnect and sign out") { disconnect() }
                        .disabled(busy)
                }
                Section("Authorized game snapshot — read only") {
                    Text(snapshot.isEmpty ? "No authorized data received" : snapshot)
                        .font(.system(.caption, design: .monospaced))
                    Text("This screen never controls the Mac or OBS.")
                }
            }
            .navigationTitle("Firebase staging")
            .onDisappear { disconnect() }
        }
    }

    @MainActor private func signIn() async {
        busy = true
        defer { busy = false; password = "" }
        disconnect()
        let attempt = generation
        guard let app = FirebaseApp.app(),
              app.options.projectID == project,
              app.options.databaseURL?.trimmingCharacters(in: CharacterSet(charactersIn: "/")) == url,
              app.options.bundleID == Bundle.main.bundleIdentifier else {
            status = "Missing or incorrect staging configuration"
            return
        }
        do {
            let result = try await Auth.auth().signIn(withEmail: email, password: password)
            guard generation == attempt else { try? Auth.auth().signOut(); return }
            let token = try await result.user.getIDTokenResult(forcingRefresh: true)
            guard generation == attempt else { return }
            guard token.claims["jesuitEnv"] as? String == "staging",
                  let game = token.claims["jesuitGame"] as? String,
                  !game.isEmpty, game.utf8.count <= 128,
                  game.range(of: "^[A-Za-z0-9_-]+$", options: .regularExpression) != nil,
                  let role = token.claims["jesuitRole"] as? String,
                  ["operator", "camera", "viewer"].contains(role) else {
                disconnect()
                status = "Signed in, but no authorized staging game assignment"
                return
            }
            let db = Database.database(url: url)
            let info = db.reference(withPath: ".info/connected")
            connectionRef = info
            connectionHandle = info.observe(.value) { value in
                let online = value.value as? Bool ?? false
                Task { @MainActor in
                    guard generation == attempt else { return }
                    connected = online
                    if !online { snapshot = "" }
                }
            }
            let ref = db.reference(withPath: "stagingGames").child(game).child("state")
            stateRef = ref
            status = "Authorized staging game: " + game
            stateHandle = ref.observe(.value, with: { value in
                var display = "No game snapshot published"
                if let object = value.value, JSONSerialization.isValidJSONObject(object),
                   let data = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys]),
                   let string = String(data: data, encoding: .utf8) {
                    display = String(string.prefix(12000))
                }
                Task { @MainActor in
                    guard generation == attempt else { return }
                    snapshot = display
                }
            }, withCancel: { _ in
                Task { @MainActor in
                    guard generation == attempt else { return }
                    disconnect()
                    status = "Database access denied or revoked"
                }
            })
        } catch {
            guard generation == attempt else { return }
            disconnect()
            status = "Sign-in or authorization failed"
        }
    }

    @MainActor private func disconnect() {
        generation = UUID()
        if let handle = stateHandle { stateRef?.removeObserver(withHandle: handle) }
        if let handle = connectionHandle { connectionRef?.removeObserver(withHandle: handle) }
        stateHandle = nil; stateRef = nil
        connectionHandle = nil; connectionRef = nil
        if FirebaseApp.app() != nil { try? Auth.auth().signOut() }
        connected = false
        snapshot = ""
        status = "Not signed in"
    }
}
