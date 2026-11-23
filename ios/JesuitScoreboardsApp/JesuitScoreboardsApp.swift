// Prototype UI source only. Add this target to a signed Xcode iOS project when
// the school has approved distribution and a developer Mac is available.
#if canImport(SwiftUI)
import SwiftUI
import JesuitScoreboardsCore

@main
struct JesuitScoreboardsApp: App {
    var body: some Scene {
        WindowGroup { HomeView() }
    }
}

private struct HomeView: View {
    @State private var selectedSport: Sport = .football

    var body: some View {
        NavigationStack {
            Form {
                Section("Development build") {
                    Text("Jesuit Scoreboards 2.0")
                    Text("Not connected to Firebase or OBS")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Section("Select sport") {
                    Picker("Sport", selection: $selectedSport) {
                        ForEach(Sport.allCases, id: \.self) { sport in
                            Text(sport.rawValue.capitalized).tag(sport)
                        }
                    }
                    Text("Selected: \(selectedSport.rawValue.capitalized)")
                }
                Section("Safety") {
                    Label("Read-only prototype", systemImage: "lock.shield")
                    Text("Live scores, camera recognition, and cloud updates are intentionally disabled.")
                        .font(.caption)
                }
            }
            .navigationTitle("Scoreboards")
        }
    }
}
#endif
